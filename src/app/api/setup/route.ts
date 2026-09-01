import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { provisionBusiness } from "@/lib/provision";

/**
 * One-time, browser-visitable setup: creates the first Business + admin
 * login without needing Node.js on the operator's machine. Gated by
 * SETUP_SECRET so a guessed URL can't provision a business out from under
 * the real owner. Self-disables permanently once a Business row exists —
 * safe to leave deployed.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const secret = params.get("secret");
  const email = params.get("email")?.trim().toLowerCase();
  const password = params.get("password");
  const businessName = params.get("business") ?? undefined;

  const expected = process.env.SETUP_SECRET;
  if (!expected) {
    return page(500, "Not configured", "SETUP_SECRET isn't set in this deployment's environment variables yet. Add it in Vercel, redeploy, then try this link again.");
  }
  if (secret !== expected) {
    return page(401, "Wrong secret", "The `secret` in this URL doesn't match SETUP_SECRET. Double-check you copied the whole link.");
  }
  if (!email || !email.includes("@")) {
    return page(400, "Missing email", "Add `&email=you@yourbusiness.com` to the URL.");
  }
  if (!password || password.length < 8) {
    return page(400, "Password too short", "Add `&password=...` with at least 8 characters to the URL.");
  }

  const result = await provisionBusiness(prisma, { ownerEmail: email, ownerPassword: password, businessName });

  if (result.alreadyProvisioned) {
    return page(
      409,
      "Already set up",
      `"${result.businessName}" already has a business profile and login — this link only works once, and it's already been used. Log in at /admin, or reset a password from Prisma Studio / your database if it's been lost.`
    );
  }

  return page(
    200,
    "You're set up",
    `Created "${result.businessName}" with the login ${result.ownerEmail}. Head to <a href="/admin">/admin</a> and sign in with the email and password you put in this URL — then customize everything from Settings. This link is now inert; visiting it again will refuse to run.`,
    true
  );
}

function page(status: number, title: string, body: string, success = false) {
  const color = success ? "#0f766e" : status >= 500 ? "#b91c1c" : "#b45309";
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;background:#f4f6f8;color:#10161d;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;}
  .card{max-width:480px;background:#fff;border:1px solid #dbe1e7;border-radius:12px;padding:32px;box-shadow:0 8px 24px rgba(16,22,29,.06);}
  h1{margin:0 0 12px;font-size:1.3rem;color:${color};}
  p{margin:0;line-height:1.6;color:#4b5867;}
  a{color:#0f766e;}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
