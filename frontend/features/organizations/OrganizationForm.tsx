"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { organizationsService } from "@/services/organizations.service";
import { planService } from "@/services/plans.service";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { AddressFields, type AddressValue } from "@/components/shared/AddressFields";

const inputClass =
  "bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors w-full";

const EMPTY_ADDRESS: AddressValue = {
  address_line1: "", address_line2: "", pincode: "",
  country: "India", state: "", city: "", district: "",
};

type FormState = {
  name: string;
  code: string;
  email: string;
  phone: string;
  phone_dial: string;
  website: string;
  plan_id: string;
  max_users: string;
  notes: string;
  address: AddressValue;
};

const EMPTY: FormState = {
  name: "", code: "", email: "", phone: "", phone_dial: "+91",
  website: "", plan_id: "", max_users: "10", notes: "",
  address: EMPTY_ADDRESS,
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-6 py-3.5 border-b border-border bg-muted/30">
        <h2 className="text-sm font-semibold text-foreground tracking-wide">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OrganizationForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");

  const { data: plansData } = useQuery({
    queryKey: ["plans-active"],
    queryFn: () => planService.listAllActive(),
  });
  const plans = (plansData?.data ?? []) as { id: number; plan_name: string; plan_code: string }[];

  const createMutation = useMutation({
    mutationFn: (body: object) => organizationsService.create(body),
    onSuccess: () => router.push("/admin/organizations"),
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to create organization."),
  });

  function setF(field: keyof Omit<FormState, "address">, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) { setError("Organization name is required."); return; }
    if (!form.code.trim()) { setError("Code is required."); return; }
    if (!/^[A-Z0-9_-]+$/.test(form.code.trim())) {
      setError("Code must be uppercase letters, numbers, underscores or hyphens only.");
      return;
    }
    const maxUsers = parseInt(form.max_users, 10);
    if (isNaN(maxUsers) || maxUsers < 1) { setError("Max users must be at least 1."); return; }

    createMutation.mutate({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      max_users: maxUsers,
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
      phone_country_code: form.phone_dial || null,
      ...(form.website.trim() && { website: form.website.trim() }),
      ...(form.plan_id && { plan_id: parseInt(form.plan_id, 10) }),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
      address_line1: form.address.address_line1 || null,
      address_line2: form.address.address_line2 || null,
      pincode: form.address.pincode || null,
      country: form.address.country || null,
      state: form.address.state || null,
      city: form.address.city || null,
      district: form.address.district || null,
    });
  }

  const isPending = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back + error */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/organizations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — main fields */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic Information */}
          <SectionCard title="Basic Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Organization Name" required>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setF("name", e.target.value)}
                    placeholder="e.g. Acme Maritime Ltd"
                    className={inputClass}
                    autoFocus
                  />
                </Field>
              </div>
              <Field
                label="Code"
                required
                hint="Uppercase letters, numbers, _ or - only. Cannot be changed later."
              >
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setF("code", e.target.value.toUpperCase())}
                  placeholder="e.g. ACME"
                  className={cn(inputClass, "font-mono tracking-widest")}
                  maxLength={50}
                />
              </Field>
              <Field label="Max Users">
                <input
                  type="number"
                  min={1}
                  value={form.max_users}
                  onChange={e => setF("max_users", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          </SectionCard>

          {/* Contact Details */}
          <SectionCard title="Contact Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setF("email", e.target.value)}
                  placeholder="contact@example.com"
                  className={inputClass}
                />
              </Field>
              <Field label="Website">
                <input
                  type="text"
                  value={form.website}
                  onChange={e => setF("website", e.target.value)}
                  placeholder="https://example.com"
                  className={inputClass}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Phone">
                  <PhoneInput
                    value={form.phone}
                    dialCode={form.phone_dial}
                    onValueChange={v => setForm(f => ({ ...f, phone: v }))}
                    onDialCodeChange={v => setForm(f => ({ ...f, phone_dial: v }))}
                    placeholder="Phone number"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* Address */}
          <SectionCard title="Address">
            <AddressFields
              value={form.address}
              onChange={addr => setForm(f => ({ ...f, address: addr }))}
              inputClass={inputClass}
            />
          </SectionCard>
        </div>

        {/* Right column — plan + notes + submit */}
        <div className="space-y-6">

          {/* Plan Assignment */}
          <SectionCard title="Plan & Licensing">
            <Field label="Assign Plan">
              <select
                value={form.plan_id}
                onChange={e => setF("plan_id", e.target.value)}
                className={inputClass}
              >
                <option value="">No plan assigned</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.plan_name} ({p.plan_code})
                  </option>
                ))}
              </select>
            </Field>
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Internal Notes">
            <Field label="Notes">
              <textarea
                rows={5}
                value={form.notes}
                onChange={e => setF("notes", e.target.value)}
                placeholder="Any internal remarks about this organization..."
                className={cn(inputClass, "resize-y")}
              />
            </Field>
          </SectionCard>

          {/* Actions */}
          <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5 space-y-3">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
            >
              <Building2 className="w-4 h-4" />
              {isPending ? "Creating..." : "Create Organization"}
            </button>
            <Link
              href="/admin/organizations"
              className="w-full flex items-center justify-center py-2.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
