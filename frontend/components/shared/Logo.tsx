import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

/**
 * Naviora sidebar header logo.
 * Full: infinity mark icon + "Naviora" + "by Blue Stratum"
 * Compact (collapsed sidebar): infinity mark icon only
 */
export function Logo({ className, compact = false }: LogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Image
          src="/logos/bluestratum-mark.png"
          alt="Naviora"
          width={34}
          height={23}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logos/bluestratum-mark.png"
        alt="Blue Stratum"
        width={38}
        height={26}
        className="object-contain flex-shrink-0"
        priority
      />
      <div className="min-w-0">
        <div className="text-white font-bold text-sm leading-tight tracking-wide truncate">
          Naviora
        </div>
        <div className="text-[10px] font-medium tracking-widest uppercase leading-tight"
             style={{ color: "rgba(24,178,188,0.85)" }}>
          by Blue Stratum
        </div>
      </div>
    </div>
  );
}

/**
 * Blue Stratum horizontal logo — "Powered by" footer use.
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
