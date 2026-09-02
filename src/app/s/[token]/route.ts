import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * A tracked demo link: /s/<token> records the open and forwards to the demo's
 * public page.
 *
 * The bare /<slug> stays reachable and unmetered — this route exists only so
 * that a link I sent to a specific lead can tell me they looked, which a
 * shared slug never could. It reveals nothing: an unknown token goes to the
 * directory, exactly like a mistyped URL.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const share = await prisma.demoShare.findUnique({
    where: { token },
    select: { id: true, business: { select: { slug: true } } },
  });

  if (!share) return NextResponse.redirect(new URL("/", _request.url));

  // Best effort: a demo that opens is worth more than a counter that is
  // exactly right, so a write failure must never break the link.
  try {
    await prisma.$transaction([
      prisma.demoShare.update({
        where: { id: share.id },
        data: { openCount: { increment: 1 }, lastOpenedAt: new Date() },
      }),
      prisma.business.update({
        where: { slug: share.business.slug },
        data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
      }),
    ]);
  } catch {
    // Ignored on purpose — see above.
  }

  return NextResponse.redirect(new URL(`/${share.business.slug}`, _request.url));
}
