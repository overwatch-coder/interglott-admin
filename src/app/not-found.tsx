import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="grid min-h-screen w-full place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-md space-y-4 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">404</p>
        <h1 className="font-display text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          This route does not exist in the Interglott Admin Console.
        </p>
        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href="/admin">Go to Admin Console</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
