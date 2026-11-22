import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function currentSession() {
  return getServerSession(authOptions);
}

export async function adminGuard() {
  const session = await currentSession();
  if (!session?.user?.id) {
    return { session: null, response: Response.json({ error: "Sign in required." }, { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { session: null, response: Response.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return { session, response: null };
}
