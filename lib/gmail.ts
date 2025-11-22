import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || "";
const USER = process.env.GMAIL_USER || "me";

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  throw new Error("Missing Google OAuth environment variables (GOOGLE_CLIENT_ID/SECRET or GMAIL_REFRESH_TOKEN)");
}

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function decodeBase64Url(str: string) {
  const replaced = str.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(replaced, "base64").toString("utf8");
}

async function getMessageBodyParts(payload: any): Promise<string[]> {
  const parts: string[] = [];
  if (!payload) return parts;

  if (payload.body?.data) {
    parts.push(decodeBase64Url(payload.body.data));
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const p of payload.parts) {
      parts.push(...(await getMessageBodyParts(p)));
    }
  }
  return parts;
}

export async function fetchLatestCodeFromSender(opts: {
  from?: string;
  to?: string;
  subjectQuery?: string;
  codeRegex?: RegExp;
}) {
  const { from, to, subjectQuery = "", codeRegex = /\b\d{4,8}\b/ } = opts;
  const qParts: string[] = [];
  if (from) qParts.push(`from:${from}`);
  if (to) qParts.push(`to:${to}`);
  if (subjectQuery) qParts.push(subjectQuery);
  const q = qParts.join(" ");

  const listRes = await gmail.users.messages.list({
    userId: USER,
    q,
    maxResults: 10,
  });

  const messages = listRes.data.messages || [];
  for (const m of messages) {
    const msg = await gmail.users.messages.get({
      userId: USER,
      id: m.id!,
      format: "full",
    });

    const snippet = msg.data.snippet || "";
    const foundInSnippet = snippet.match(codeRegex);
    if (foundInSnippet) {
      return { type: "code", code: foundInSnippet[0], snippet, id: m.id };
    }

    const payload = msg.data.payload;
    const bodies = await getMessageBodyParts(payload);

    // Check for household/update links first
    for (const b of bodies) {
      // look for Netflix household/update link patterns
      const linkMatch = b.match(/https?:\/\/(?:www\.)?netflix\.com\/account\/(?:update-primary|set-primary)[^\s"'<>]*/i);
      if (linkMatch) {
        const link = linkMatch[0];
        return { type: "link", link, body: b, id: m.id };
      }
    }

    for (const b of bodies) {
      const found = b.match(codeRegex);
      if (found) {
        return { type: "code", code: found[0], body: b, id: m.id };
      }
    }
  }

  return null;
}