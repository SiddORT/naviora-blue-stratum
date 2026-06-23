"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
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
  email: string;
  phone: string;
  phone_dial: string;
  website: string;
  plan_id: string;
  max_users: string;
  notes: string;
  subscription_status: string;
  address: AddressValue;
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

const STATUS_OPTIONS = [
  { value: "active",    label: "Active" },
  { value: "trial",     label: "Trial" },
  { value: "inactive",  label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "expired",   label: "Expired" },
];

interface Props { uuid: string; }

export function OrganizationEditForm({ uuid }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState("");

  const { data: orgData, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", uuid],
    queryFn: () => organizationsService.get(uuid),
  });

  const { data: plansData } = useQuery({
    queryKey: ["plans"],
    queryFn: () => planService.listAllActive(),
    staleTime: 0,
  });
  const plans = (plansData?.data ?? []) as { id: number; plan_name: string; plan_code: string }[];

  useEffect(() => {
    const org = orgData?.data as any;
    if (!org) return;
    setForm({
      name: org.name ?? "",
      email: org.email ?? "",
      phone: org.phone ?? "",
      phone_dial: org.phone_country_code ?? "+91",
      website: org.website ?? "",
      plan_id: org.plan_id ? String(org.plan_id) : "",
      max_users: String(org.max_users ?? 10),
      notes: org.notes ?? "",
      subscription_status: org.subscription_status ?? "active",
      address: {
        address_line1: org.address_line1 ?? "",
        address_line2: org.address_line2 ?? "",
        pincode: org.pincode ?? "",
        country: org.country ?? "India",
        state: org.state ?? "",
        city: org.city ?? "",
        district: org.district ?? "",
      },
    });
  }, [orgData]);

  const updateMutation = useMutation({
    mutationFn: (body: object) => organizationsService.update(uuid, body),
    onSuccess: () => router.push("/admin/organizations"),
    onError: (e: any) => setError(e?.response?.data?.message ?? "Failed to update organization."),
  });

  function setF(field: keyof Omit<FormState, "address">, value: string) {
    setForm(f => f ? { ...f, [field]: value } : f);
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError("");
    if (!form.name.trim()) { setError("Organization name is required."); return; }
    const maxUsers = parseInt(form.max_users, 10);
    if (isNaN(maxUsers) || maxUsers < 1) { setError("Max users must be at least 1."); return; }

    updateMutation.mutate({
      name: form.name.trim(),
      max_users: maxUsers,
      subscription_status: form.subscription_status,
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
      phone_country_code: form.phone_dial || null,
      ...(form.website.trim() && { website: form.website.trim() }),
      plan_id: form.plan_id ? parseInt(form.plan_id, 10) : null,
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

  const org = orgData?.data as any;
  const isPending = updateMutation.isPending;

  if (orgLoading || !form) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card shadow-sm h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/organizations"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Organizations
        </Link>
        {org && (
          <span className="text-xs font-mono text-muted-foreground border border-border rounded px-2 py-0.5 bg-muted/40">
            {org.code}
          </span>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

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
              <Field label="Code" hint="Cannot be changed after creation.">
                <input
                  type="text"
                  value={org?.code ?? ""}
                  disabled
                  className={cn(inputClass, "font-mono tracking-widest opacity-60 cursor-not-allowed")}
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
                    onValueChange={v => setForm(f => f ? { ...f, phone: v } : f)}
                    onDialCodeChange={v => setForm(f => f ? { ...f, phone_dial: v } : f)}
                    placeholder="Phone number"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Address">
            <AddressFields
              value={form.address}
              onChange={addr => setForm(f => f ? { ...f, address: addr } : f)}
              inputClass={inputClass}
            />
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          <SectionCard title="Status & Plan">
            <div className="space-y-4">
              <Field label="Subscription Status">
                <select
                  value={form.subscription_status}
                  onChange={e => setF("subscription_status", e.target.value)}
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
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
            </div>
          </SectionCard>

          <SectionCard title="Internal Notes">
            <Field label="Notes">
              <textarea
                rows={5}
                value={form.notes}
                onChange={e => setF("notes", e.target.value)}
                placeholder="Any internal remarks..."
                className={cn(inputClass, "resize-y")}
              />
            </Field>
          </SectionCard>

          <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5 space-y-3">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#D4A63A 0%,#B8860B 100%)" }}
            >
              <Save className="w-4 h-4" />
              {isPending ? "Saving..." : "Save Changes"}
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
