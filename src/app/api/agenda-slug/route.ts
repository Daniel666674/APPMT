import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkSlug } from "@/lib/agenda-creator";

/**
 * Live availability check for the creator's URL field. Open to a signed-in
 * user or to whoever holds SETUP_SECRET — the same two audiences that can
 * reach the creator itself. It only ever answers "free or taken" about a slug
 * the caller already typed, and never lists what exists.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  const provided = request.nextUrl.searchParams.get("secret");
  const session = await getSession();
  if (!session && !(secret && provided === secret)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const value = request.nextUrl.searchParams.get("value") ?? "";
  return NextResponse.json(await checkSlug(value));
}
