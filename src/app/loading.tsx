import Image from "next/image";

/**
 * Next.js App Router loading UI. Shown instantly while route segments
 * are compiling/streaming, instead of a blank screen.
 */
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="relative h-16 w-16 animate-pulse">
        <Image
          src="/logo-mark-256.png"
          alt=""
          fill
          priority
          sizes="64px"
          className="object-contain rounded-2xl"
        />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        Loading Mindful Therapy 360…
      </div>
    </div>
  );
}
