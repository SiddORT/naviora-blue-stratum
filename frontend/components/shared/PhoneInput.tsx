"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CountryDialCode {
  code: string;
  flag: string;
  name: string;
  iso: string;
}

export const DIAL_CODES: CountryDialCode[] = [
  { iso: "IN", flag: "🇮🇳", name: "India",            code: "+91"  },
  { iso: "US", flag: "🇺🇸", name: "USA",              code: "+1"   },
  { iso: "GB", flag: "🇬🇧", name: "UK",               code: "+44"  },
  { iso: "AE", flag: "🇦🇪", name: "UAE",              code: "+971" },
  { iso: "SA", flag: "🇸🇦", name: "Saudi Arabia",     code: "+966" },
  { iso: "QA", flag: "🇶🇦", name: "Qatar",            code: "+974" },
  { iso: "OM", flag: "🇴🇲", name: "Oman",             code: "+968" },
  { iso: "KW", flag: "🇰🇼", name: "Kuwait",           code: "+965" },
  { iso: "BH", flag: "🇧🇭", name: "Bahrain",          code: "+973" },
  { iso: "SG", flag: "🇸🇬", name: "Singapore",        code: "+65"  },
  { iso: "MY", flag: "🇲🇾", name: "Malaysia",         code: "+60"  },
  { iso: "PH", flag: "🇵🇭", name: "Philippines",      code: "+63"  },
  { iso: "ID", flag: "🇮🇩", name: "Indonesia",        code: "+62"  },
  { iso: "TH", flag: "🇹🇭", name: "Thailand",         code: "+66"  },
  { iso: "VN", flag: "🇻🇳", name: "Vietnam",          code: "+84"  },
  { iso: "CN", flag: "🇨🇳", name: "China",            code: "+86"  },
  { iso: "JP", flag: "🇯🇵", name: "Japan",            code: "+81"  },
  { iso: "KR", flag: "🇰🇷", name: "South Korea",      code: "+82"  },
  { iso: "PK", flag: "🇵🇰", name: "Pakistan",         code: "+92"  },
  { iso: "BD", flag: "🇧🇩", name: "Bangladesh",       code: "+880" },
  { iso: "LK", flag: "🇱🇰", name: "Sri Lanka",        code: "+94"  },
  { iso: "NP", flag: "🇳🇵", name: "Nepal",            code: "+977" },
  { iso: "MM", flag: "🇲🇲", name: "Myanmar",          code: "+95"  },
  { iso: "AU", flag: "🇦🇺", name: "Australia",        code: "+61"  },
  { iso: "NZ", flag: "🇳🇿", name: "New Zealand",      code: "+64"  },
  { iso: "RU", flag: "🇷🇺", name: "Russia",           code: "+7"   },
  { iso: "UA", flag: "🇺🇦", name: "Ukraine",          code: "+380" },
  { iso: "TR", flag: "🇹🇷", name: "Turkey",           code: "+90"  },
  { iso: "GR", flag: "🇬🇷", name: "Greece",           code: "+30"  },
  { iso: "NO", flag: "🇳🇴", name: "Norway",           code: "+47"  },
  { iso: "DK", flag: "🇩🇰", name: "Denmark",          code: "+45"  },
  { iso: "FI", flag: "🇫🇮", name: "Finland",          code: "+358" },
  { iso: "SE", flag: "🇸🇪", name: "Sweden",           code: "+46"  },
  { iso: "DE", flag: "🇩🇪", name: "Germany",          code: "+49"  },
  { iso: "FR", flag: "🇫🇷", name: "France",           code: "+33"  },
  { iso: "IT", flag: "🇮🇹", name: "Italy",            code: "+39"  },
  { iso: "ES", flag: "🇪🇸", name: "Spain",            code: "+34"  },
  { iso: "PT", flag: "🇵🇹", name: "Portugal",         code: "+351" },
  { iso: "NL", flag: "🇳🇱", name: "Netherlands",      code: "+31"  },
  { iso: "NG", flag: "🇳🇬", name: "Nigeria",          code: "+234" },
  { iso: "ZA", flag: "🇿🇦", name: "South Africa",     code: "+27"  },
  { iso: "KE", flag: "🇰🇪", name: "Kenya",            code: "+254" },
  { iso: "EG", flag: "🇪🇬", name: "Egypt",            code: "+20"  },
  { iso: "BR", flag: "🇧🇷", name: "Brazil",           code: "+55"  },
  { iso: "CA", flag: "🇨🇦", name: "Canada",           code: "+1"   },
  { iso: "MX", flag: "🇲🇽", name: "Mexico",           code: "+52"  },
  { iso: "PA", flag: "🇵🇦", name: "Panama",           code: "+507" },
  { iso: "LR", flag: "🇱🇷", name: "Liberia",          code: "+231" },
  { iso: "MH", flag: "🇲🇭", name: "Marshall Islands", code: "+692" },
  { iso: "BS", flag: "🇧🇸", name: "Bahamas",          code: "+1242"},
];

interface PhoneInputProps {
  value: string;
  dialCode: string;
  onValueChange: (v: string) => void;
  onDialCodeChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

const inputBase = "bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

export function PhoneInput({
  value, dialCode, onValueChange, onDialCodeChange, placeholder = "Phone number", className,
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = DIAL_CODES.find(d => d.code === dialCode) ?? DIAL_CODES[0];
  const filtered = DIAL_CODES.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.code.includes(search)
  );

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative flex", className)}>
      {/* Dial code trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          inputBase,
          "flex items-center gap-1.5 px-2.5 py-2 rounded-l-lg border-r-0 min-w-[86px] justify-between flex-shrink-0 rounded-r-none",
          open && "ring-2 ring-primary/30 border-primary z-10"
        )}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs font-medium">{selected.code}</span>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Number input */}
      <input
        type="tel"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputBase, "flex-1 px-3 py-2 rounded-r-lg rounded-l-none border-l-0 min-w-0")}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-[200] w-64 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(d => (
              <button
                key={`${d.iso}-${d.code}`}
                type="button"
                onClick={() => { onDialCodeChange(d.code); setOpen(false); setSearch(""); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left",
                  d.iso === selected.iso && "bg-primary/10 text-primary"
                )}
              >
                <span className="text-base">{d.flag}</span>
                <span className="flex-1 text-foreground">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
