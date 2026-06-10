import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

/**
 * PASE Compass product logo — sidebar header.
 * Source image: pase-simulator.png  316 × 350 px  (≈ 0.903 : 1)
 */
export function Logo({ className, compact = false }: LogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        {/* 36 wide × 40 tall keeps aspect ratio  316:350 */}
        <Image
          src="/logos/pase-simulator.png"
          alt="PASE Compass"
          width={36}
          height={40}
          className="rounded-lg object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logos/pase-simulator.png"
        alt="PASE Compass"
        width={36}
        height={40}
        className="rounded-lg object-cover flex-shrink-0"
        priority
      />
      <div className="min-w-0">
        <div className="text-foreground font-semibold text-sm leading-tight tracking-wide truncate">
          PASE Compass
        </div>
        <div className="text-[10px] text-primary font-medium tracking-widest uppercase leading-tight">
          by Blue Stratum
        </div>
      </div>
    </div>
  );
}

/**
 * Blue Stratum parent-brand logo — "Powered by" use.
 * Source image: bluestratum-h-light.png  428 × 72 px  (≈ 5.94 : 1)
 *
 * Light mode → original colours (dark text on transparent bg).
 * Dark mode  → brightness(0) invert(1) gives clean white-on-dark silhouette.
 */
export function BlueStratumLogo({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  // Keep the 428:72 ratio.  sm → 100 × 17,  md → 130 × 22
  const width  = size === "md" ? 130 : 100;
  const height = size === "md" ? 22  : 17;

  return (
    <div className={cn("flex items-center", className)}>
      {/* Light mode */}
      <Image
        src="/logos/bluestratum-h-light.png"
        alt="Blue Stratum"
        width={width}
        height={height}
        className="object-contain block dark:hidden"
        priority
      />
      {/* Dark mode — brighten to keep colors, lift dark text to readable */}
      <Image
        src="/logos/bluestratum-h-light.png"
        alt="Blue Stratum"
        width={width}
        height={height}
        className="object-contain hidden dark:block"
        style={{ filter: "brightness(2.5) contrast(0.85)" }}
        priority
      />
    </div>
  );
}
