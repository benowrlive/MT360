import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary/10">
          <Compass className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight text-primary">404</h1>
          <h2 className="text-xl font-semibold">Page not found</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" /> Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
