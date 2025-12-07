import { NextResponse } from "next/server";
import { getEmailAccount } from "@/lib/email-db";
import { fetchLatestCodeFromIMAP } from "@/lib/imap-email";

const isDev = process.env.NODE_ENV === "development";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email address is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email exists in database
    const account = getEmailAccount(email);
    if (!account) {
      return NextResponse.json(
        {
          success: false,
          message: "This email address is not registered in our system. Please contact administrator to add your email.",
        },
        { status: 403 }
      );
    }

    // Fetch code using IMAP with timeout
    const result = await Promise.race([
      fetchLatestCodeFromIMAP(account, {
        to: email,
        subjectQuery: body?.subjectQuery || "",
        codeRegex: body?.codeRegex ? new RegExp(body.codeRegex, "i") : undefined,
      }),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - email search took too long')), 30000)
      )
    ]) as any;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "No Netflix code or household update link found in your recent emails. Make sure Netflix emails are in your inbox.",
        },
        { status: 404 }
      );
    }

    // Normalize response: either a code or a link
    if (result.type === "link") {
      return NextResponse.json({
        success: true,
        type: "link",
        link: result.link,
        meta: { id: result.id },
      });
    }

    return NextResponse.json({
      success: true,
      type: "code",
      code: result.code,
      meta: { id: result.id },
    });
  } catch (err: any) {
    console.error("Top-level error:", err?.stack || err);
    // Only expose detailed errors in development
    const message = isDev
      ? String(err?.message || err)
      : "An error occurred while fetching your code. Please try again.";
    return NextResponse.json(
      {
        success: false,
        message,
        ...(isDev && { stack: String(err?.stack || "") }),
      },
      { status: 500 }
    );
  }
}
