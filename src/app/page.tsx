import { redirect } from "next/navigation";
import { currentSession } from "@/lib/serverAuth";

export default async function HomePage() {
  const session = await currentSession();
  if (session?.user?.role === "admin") {
    redirect("/admin");
  }
  redirect("/admin/login");
}
