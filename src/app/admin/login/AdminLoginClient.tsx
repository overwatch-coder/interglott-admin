"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user?.role === "admin") router.replace("/admin");
    }).catch(() => undefined);
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast({ title: "Sign-in failed", description: "Invalid email or password." });
        return;
      }
      const session = await getSession();
      if (session?.user?.role === "admin") {
        router.replace("/admin");
      } else {
        await signOut({ redirect: false });
        toast({ title: "Access denied", description: "This account is not an admin." });
      }
    } catch {
      toast({ title: "Sign-in failed", description: "Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen w-full place-items-center bg-background px-4 py-8 sm:px-6">
      <Card className="mx-auto w-full max-w-md space-y-6 p-5 sm:p-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto grid size-16 place-items-center overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-sm">
            <Image
              src="/interglott-logo.png"
              alt="Interglott"
              width={56}
              height={56}
              priority
              className="size-full object-contain"
            />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Admin sign-in</h1>
          <p className="text-sm text-muted-foreground">Restricted to authorized administrators.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@interglott.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              inputMode="email"
              className="min-w-0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="min-w-0 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="btn-icon-sm absolute inset-y-0 right-0 flex h-full items-center px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-md"
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
