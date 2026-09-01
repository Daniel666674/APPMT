import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "appmt_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a long random value in your environment variables."
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  /**
   * The business this session is currently managing. A business owner's
   * login always has one and it never changes. The platform admin starts
   * with none — they belong to no business — and points it at whichever
   * agenda they open from the console.
   */
  businessId: string | null;
  email: string;
  name: string;
  role: "OWNER" | "STAFF";
  /** Reseller-level access. Never inferred — always read back from the DB. */
  isPlatformAdmin: boolean;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      (typeof payload.businessId === "string" || payload.businessId === null) &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      (payload.role === "OWNER" || payload.role === "STAFF")
    ) {
      return {
        userId: payload.userId,
        businessId: (payload.businessId as string | null) ?? null,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        isPlatformAdmin: payload.isPlatformAdmin === true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** Reads and verifies the session cookie for the current request. Server-side only. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** For server components/actions that must have an authenticated session. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * The single entry point for admin data access: returns the session plus the
 * business it belongs to. Every admin query scopes on the businessId it
 * returns, which is what stops one client seeing another's appointments.
 */
export async function requireBusinessSession() {
  const session = await requireSession();

  // The cookie says whether this session is platform-level, but the cookie is
  // issued by us and could outlive the grant, so the claim is re-checked
  // against the database on every request rather than trusted as signed.
  const isPlatformAdmin = await isPlatformAdminUser(session.userId);

  // The platform admin belongs to no business until they open one. Sending
  // them to the console is the right answer, not an error.
  if (!session.businessId) {
    redirect(isPlatformAdmin ? "/admin/negocios" : "/admin/login");
  }

  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) {
    // The agenda was deleted out from under a live session.
    redirect(isPlatformAdmin ? "/admin/negocios" : "/admin/login");
  }

  // A business owner is pinned to their own agenda. If their session points
  // anywhere else — a stale cookie, or a forged one — it is refused. The
  // cookie is not cleared here: a server render cannot write cookies, and
  // trying throws a 500 instead of sending the person to sign in. Signing in
  // replaces it, which is the same outcome.
  if (!isPlatformAdmin) {
    const owner = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { businessId: true },
    });
    if (!owner || owner.businessId !== business.id) redirect("/admin/login");
  }

  return { session: { ...session, isPlatformAdmin }, business, businessId: business.id, isPlatformAdmin };
}

/**
 * The admin shell's context: who is signed in, and which agenda — if any —
 * they currently have open. Unlike requireBusinessSession this never
 * redirects on a missing agenda, because the console itself is a page that
 * legitimately has none.
 */
export async function getAdminContext() {
  const session = await requireSession();
  const isPlatformAdmin = await isPlatformAdminUser(session.userId);

  let business = session.businessId
    ? await prisma.business.findUnique({ where: { id: session.businessId } })
    : null;

  // Same ownership rule as requireBusinessSession, applied here too: the
  // shell renders the agenda's name, so a forged session must not reach it
  // even though the page inside would separately refuse.
  if (business && !isPlatformAdmin) {
    const owner = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { businessId: true },
    });
    if (!owner || owner.businessId !== business.id) business = null;
  }

  // A business owner with no agenda has nothing to administer. The cookie is
  // not cleared here: a server render cannot write cookies, and signing in
  // replaces it anyway.
  if (!business && !isPlatformAdmin) redirect("/admin/login");

  return { session, business, isPlatformAdmin };
}

/** True only if the database still says this user runs the platform. */
export async function isPlatformAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true, active: true },
  });
  return Boolean(user?.isPlatformAdmin && user.active);
}

/**
 * Gate for anything that reaches across businesses — the agenda console, the
 * creator, deleting a client. Sends anyone else back to their own dashboard
 * rather than leaking that the page exists.
 */
export async function requirePlatformAdmin() {
  const session = await requireSession();
  if (!(await isPlatformAdminUser(session.userId))) redirect("/admin");
  return session;
}
