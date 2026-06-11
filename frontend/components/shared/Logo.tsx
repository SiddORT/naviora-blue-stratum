import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

/**
 * Naviora sidebar header logo.
 * Full:    infinity mark + "Naviora" gradient headline + "by Blue Stratum" teal label
 * Compact: infinity mark only (collapsed sidebar)
 */
export function Logo({ className, compact = false }: LogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Image
          src="/logos/bluestratum-mark-v2.png"
          alt="Naviora"
          width={36}
          height={24}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logos/bluestratum-mark-v2.png"
        alt="Naviora"
        width={52}
        height={35}
        className="object-contain flex-shrink-0"
        priority
      />
      <div className="min-w-0">
        <div
          className="font-black text-[15px] leading-tight truncate"
          style={{
            background: "linear-gradient(135deg, #F5A623 0%, #FFD580 45%, #18B2BC 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.01em",
          }}
        >
          Naviora
        </div>
        <div
          className="text-[9px] font-semibold tracking-[0.20em] uppercase leading-tight mt-0.5"
          style={{ color: "rgba(24,178,188,0.65)" }}
        >
          by Blue Stratum
        </div>
      </div>
    </div>
  );
}

/**
 * Blue Stratum horizontal logo — "Powered by" sidebar footer.
 */
export function BlueStratumLogo({
  size = "sm",
  className,
}: {
  size?: "sm" | "md";
  className?: string;
}) {
  const width  = size === "md" ? 130 : 100;
  const height = size === "md" ? 22  : 17;

  return (
    <div className={cn("flex items-center", className)}>
      <Image
        src="/logos/bluestratum-h-light.png"
        alt="Blue Stratum"
        width={width}
        height={height}
        className="object-contain block dark:hidden"
        priority
      />
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
