import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact = false }: LogoProps) {
  if (compact) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="w-8 h-8 rounded-md gradient-gold flex items-center justify-center">
          <span className="text-black font-bold text-sm tracking-tight">PC</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-md gradient-gold flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-sm tracking-tight">PC</span>
        </div>
        <div>
          <div className="text-foreground font-semibold text-sm leading-tight tracking-wide">
            PASE Compass
          </div>
          <div className="text-[10px] text-primary font-medium tracking-widest uppercase leading-tight">
            Blue Stratum
          </div>
        </div>
      </div>
    </div>
  );
}
