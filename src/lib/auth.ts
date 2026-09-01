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
   * The business this session is currently managing. For an ordinary client
   * login this is their own business and never changes. A platform admin can
   * point it at any business (see switchBusiness), which is what lets one
   * login run every agenda on the deployment.
   */
  businessId: string;
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
      typeof payload.businessId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      (payload.role === "OWNER" || payload.role === "STAFF")
    ) {
      return {
        userId: payload.userId,
        businessId: payload.businessId,
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
  const business = await prisma.business.findUnique({ where: { id: session.businessId } });
  if (!business) {
    // The business was deleted out from under a live session.
    await clearSessionCookie();
    redirect("/admin/login");
  }

  // The cookie says whether this session is platform-level, but the cookie is
  // issued by us and could outlive the grant, so the claim is re-checked
  // against the database on every request rather than trusted as signed.
  const isPlatformAdmin = await isPlatformAdminUser(session.userId);

  // An ordinary client login is pinned to its own business. If a session
  // somehow points elsewhere — a stale cookie from when the user was a
  // platform admin, or a forged one — it is refused rather than honoured.
  if (!isPlatformAdmin) {
    const owner = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { businessId: true },
    });
    if (!owner || owner.businessId !== business.id) {
      await clearSessionCookie();
      redirect("/admin/login");
    }
  }

  return { session: { ...session, isPlatformAdmin }, business, businessId: business.id, isPlatformAdmin };
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
