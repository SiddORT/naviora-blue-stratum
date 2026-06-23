"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const COUNTRIES = [
  { flag: "🇮🇳", name: "India",            iso: "IN" },
  { flag: "🇺🇸", name: "USA",              iso: "US" },
  { flag: "🇬🇧", name: "UK",               iso: "GB" },
  { flag: "🇦🇪", name: "UAE",              iso: "AE" },
  { flag: "🇸🇦", name: "Saudi Arabia",     iso: "SA" },
  { flag: "🇶🇦", name: "Qatar",            iso: "QA" },
  { flag: "🇴🇲", name: "Oman",             iso: "OM" },
  { flag: "🇰🇼", name: "Kuwait",           iso: "KW" },
  { flag: "🇧🇭", name: "Bahrain",          iso: "BH" },
  { flag: "🇸🇬", name: "Singapore",        iso: "SG" },
  { flag: "🇲🇾", name: "Malaysia",         iso: "MY" },
  { flag: "🇵🇭", name: "Philippines",      iso: "PH" },
  { flag: "🇮🇩", name: "Indonesia",        iso: "ID" },
  { flag: "🇹🇭", name: "Thailand",         iso: "TH" },
  { flag: "🇻🇳", name: "Vietnam",          iso: "VN" },
  { flag: "🇨🇳", name: "China",            iso: "CN" },
  { flag: "🇯🇵", name: "Japan",            iso: "JP" },
  { flag: "🇰🇷", name: "South Korea",      iso: "KR" },
  { flag: "🇵🇰", name: "Pakistan",         iso: "PK" },
  { flag: "🇧🇩", name: "Bangladesh",       iso: "BD" },
  { flag: "🇱🇰", name: "Sri Lanka",        iso: "LK" },
  { flag: "🇳🇵", name: "Nepal",            iso: "NP" },
  { flag: "🇲🇲", name: "Myanmar",          iso: "MM" },
  { flag: "🇦🇺", name: "Australia",        iso: "AU" },
  { flag: "🇳🇿", name: "New Zealand",      iso: "NZ" },
  { flag: "🇷🇺", name: "Russia",           iso: "RU" },
  { flag: "🇺🇦", name: "Ukraine",          iso: "UA" },
  { flag: "🇹🇷", name: "Turkey",           iso: "TR" },
  { flag: "🇬🇷", name: "Greece",           iso: "GR" },
  { flag: "🇳🇴", name: "Norway",           iso: "NO" },
  { flag: "🇩🇰", name: "Denmark",          iso: "DK" },
  { flag: "🇫🇮", name: "Finland",          iso: "FI" },
  { flag: "🇸🇪", name: "Sweden",           iso: "SE" },
  { flag: "🇩🇪", name: "Germany",          iso: "DE" },
  { flag: "🇫🇷", name: "France",           iso: "FR" },
  { flag: "🇮🇹", name: "Italy",            iso: "IT" },
  { flag: "🇪🇸", name: "Spain",            iso: "ES" },
  { flag: "🇵🇹", name: "Portugal",         iso: "PT" },
  { flag: "🇳🇱", name: "Netherlands",      iso: "NL" },
  { flag: "🇳🇬", name: "Nigeria",          iso: "NG" },
  { flag: "🇿🇦", name: "South Africa",     iso: "ZA" },
  { flag: "🇰🇪", name: "Kenya",            iso: "KE" },
  { flag: "🇪🇬", name: "Egypt",            iso: "EG" },
  { flag: "🇧🇷", name: "Brazil",           iso: "BR" },
  { flag: "🇨🇦", name: "Canada",           iso: "CA" },
  { flag: "🇲🇽", name: "Mexico",           iso: "MX" },
  { flag: "🇵🇦", name: "Panama",           iso: "PA" },
  { flag: "🇱🇷", name: "Liberia",          iso: "LR" },
  { flag: "🇲🇭", name: "Marshall Islands", iso: "MH" },
  { flag: "🇧🇸", name: "Bahamas",          iso: "BS" },
];

export interface AddressValue {
  address_line1: string;
  address_line2: string;
  pincode: string;
  country: string;
  state: string;
  city: string;
  district: string;
}

interface AddressFieldsProps {
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  inputClass: string;
}

export function AddressFields({ value, onChange, inputClass }: AddressFieldsProps) {
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const set = (k: keyof AddressValue) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...value, [k]: e.target.value });

  async function lookupPincode() {
    const pin = value.pincode.trim();
    if (pin.length !== 6 || !/^[0-9]{6}$/.test(pin)) {
      setLookupError("Enter a valid 6-digit Indian pincode.");
      return;
    }
    setLookingUp(true);
    setLookupError("");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        onChange({
          ...value,
          country: "India",
          state: po.State ?? "",
          district: po.District ?? "",
          city: po.Block ?? po.Division ?? "",
        });
      } else {
        setLookupError("Pincode not found.");
      }
    } catch {
      setLookupError("Lookup failed. Check your connection.");
    } finally {
      setLookingUp(false);
    }
  }

  const countryItem = COUNTRIES.find(c => c.name === value.country);

  return (
    <div className="space-y-3">
      {/* Line 1 */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Address Line 1
        </label>
        <input
          className={cn(inputClass, "w-full")}
          value={value.address_line1}
          onChange={set("address_line1")}
          placeholder="Building / Street / Area"
        />
      </div>

      {/* Line 2 */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Address Line 2
        </label>
        <input
          className={cn(inputClass, "w-full")}
          value={value.address_line2}
          onChange={set("address_line2")}
          placeholder="Landmark / Suite / Floor (optional)"
        />
      </div>

      {/* Pincode + lookup */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Pincode / ZIP
        </label>
        <div className="flex gap-2">
          <input
            className={cn(inputClass, "flex-1")}
            value={value.pincode}
            onChange={set("pincode")}
            placeholder="e.g. 400001"
            maxLength={10}
          />
          <button
            type="button"
            onClick={lookupPincode}
            disabled={lookingUp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {lookingUp ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            {lookingUp ? "Looking up..." : "Lookup"}
          </button>
        </div>
        {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
      </div>

      {/* Country */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Country
        </label>
        <div className="relative">
          {countryItem && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">
              {countryItem.flag}
            </span>
          )}
          <select
            className={cn(inputClass, "w-full", countryItem ? "pl-9" : "")}
            value={value.country}
            onChange={set("country")}
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => (
              <option key={c.iso} value={c.name}>{c.flag} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* State + District */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">State</label>
          <input className={cn(inputClass, "w-full")} value={value.state} onChange={set("state")} placeholder="State / Province" />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">District</label>
          <input className={cn(inputClass, "w-full")} value={value.district} onChange={set("district")} placeholder="District" />
        </div>
      </div>

      {/* City */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">City</label>
        <input className={cn(inputClass, "w-full")} value={value.city} onChange={set("city")} placeholder="City / Town" />
      </div>
    </div>
  );
}
