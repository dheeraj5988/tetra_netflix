import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sender = String(body?.sender || "").trim();
    if (!sender) {
      return NextResponse.json({ success: false, message: "Missing sender" }, { status: 400 });
    }

    let fetchLatestCodeFromSender: any;
    try {
      const mod = await import("../../../../lib/gmail");
      fetchLatestCodeFromSender = mod.fetchLatestCodeFromSender;
      if (!fetchLatestCodeFromSender) throw new Error("fetchLatestCodeFromSender not exported");
    } catch (impErr) {
      console.error("Import error:", impErr);
      return NextResponse.json({ success: false, message: "Import error: " + String(impErr?.message || impErr) }, { status: 500 });
    }

    const result = await fetchLatestCodeFromSender({
      from: sender,
      subjectQuery: body?.subjectQuery || "",
      codeRegex: body?.codeRegex ? new RegExp(body.codeRegex, "i") : undefined,
    });

    if (!result) {
      return NextResponse.json({ success: false, message: "No code found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, code: result.code, meta: { id: result.id } });
  } catch (err: any) {
    console.error("Top-level error:", err?.stack || err);
    // TEMP: return the error message and stack for debugging (remove before production)
    return NextResponse.json({ success: false, message: String(err?.message || err), stack: String(err?.stack || "") }, { status: 500 });
  }
}