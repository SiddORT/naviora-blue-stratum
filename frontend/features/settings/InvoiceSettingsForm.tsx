"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { settingsService, type InvoiceSettings } from "@/services/settings.service";
import { Save, Receipt } from "lucide-react";

const inputClass = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5";

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "AED", symbol: "AED", label: "UAE Dirham" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
];

export function InvoiceSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-invoice"],
    queryFn: () => settingsService.getInvoice(),
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<InvoiceSettings>();

  useEffect(() => {
    if (data?.data) reset(data.data);
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: Partial<InvoiceSettings>) => settingsService.updateInvoice(values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings-invoice"] }),
  });

  const invoicePrefix = watch("invoice_prefix") || "INV";
  const invoiceStart = watch("invoice_start_number") || 1;
  const quotationPrefix = watch("quotation_prefix") || "QTN";
  const quotationStart = watch("quotation_start_number") || 1;

  const pad = (n: number) => String(n).padStart(6, "0");

  if (isLoading) {
    return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Receipt size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Document Numbering</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Invoices</h4>
            <div>
              <label className={labelClass}>Prefix</label>
              <input {...register("invoice_prefix")} className={inputClass} placeholder="INV" />
            </div>
            <div>
              <label className={labelClass}>Start Number</label>
              <input {...register("invoice_start_number", { valueAsNumber: true })} type="number" min={1} className={inputClass} />
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <p className="text-sm font-mono text-primary font-semibold">{invoicePrefix}-{pad(invoiceStart)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quotations</h4>
            <div>
              <label className={labelClass}>Prefix</label>
              <input {...register("quotation_prefix")} className={inputClass} placeholder="QTN" />
            </div>
            <div>
              <label className={labelClass}>Start Number</label>
              <input {...register("quotation_start_number", { valueAsNumber: true })} type="number" min={1} className={inputClass} />
            </div>
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Preview</p>
              <p className="text-sm font-mono text-primary font-semibold">{quotationPrefix}-{pad(quotationStart)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Receipt size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Currency & Tax</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Currency</label>
            <select
              {...register("currency_code")}
              onChange={(e) => {
                const currency = CURRENCIES.find((c) => c.code === e.target.value);
                if (currency) {
                  setValue("currency_code", currency.code);
                  setValue("currency_symbol", currency.symbol);
                }
              }}
              className={inputClass}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Currency Symbol</label>
            <input {...register("currency_symbol")} className={inputClass} placeholder="$" />
          </div>
          <div>
            <label className={labelClass}>Tax Name</label>
            <input {...register("tax_name")} className={inputClass} placeholder="GST" />
          </div>
          <div>
            <label className={labelClass}>Tax Percentage (%)</label>
            <input {...register("tax_percentage", { valueAsNumber: true })} type="number" step="0.01" min={0} max={100} className={inputClass} placeholder="9.00" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
          <Receipt size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Document Footer</h3>
        </div>
        <div>
          <label className={labelClass}>Invoice Footer Text</label>
          <textarea
            {...register("invoice_footer")}
            rows={3}
            className={inputClass}
            placeholder="Thank you for your business. Payment is due within 30 days."
          />
          <p className="text-xs text-muted-foreground mt-1">This text appears at the bottom of all invoices and quotations.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {mutation.isSuccess && <p className="text-sm text-emerald-400">Invoice settings saved.</p>}
        {mutation.isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}
        {!mutation.isSuccess && !mutation.isError && <span />}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
