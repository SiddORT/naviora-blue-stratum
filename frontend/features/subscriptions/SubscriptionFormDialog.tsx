"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { subscriptionService, planService } from "@/services/plans.service";
import type { Subscription } from "@/types/plan.types";
import { BILLING_CYCLES, SUBSCRIPTION_STATUSES } from "@/types/plan.types";

interface Props {
  open: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  presetOrgId?: number;
}

export function SubscriptionFormDialog({ open, onClose, subscription, presetOrgId }: Props) {
  const qc = useQueryClient();
  const isEdit = !!subscription;

  const { data: plansData } = useQuery({
    queryKey: ["plans", "all"],
    queryFn: async () => {
      const res = await planService.list({ page: 1, page_size: 100, status: "Active" });
      return res.data;
    },
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      organization_id: presetOrgId ?? 0,
      plan_id: 0,
      billing_cycle: "Monthly" as string,
      subscription_status: "Active" as string,
      auto_renew: true,
      end_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (subscription) {
        reset({
          organization_id: subscription.organization_id,
          plan_id: subscription.plan_id,
          billing_cycle: subscription.billing_cycle,
          subscription_status: subscription.subscription_status,
          auto_renew: subscription.auto_renew,
          end_date: subscription.end_date ? subscription.end_date.split("T")[0] : "",
        });
      } else {
        reset({ organization_id: presetOrgId ?? 0, plan_id: 0, billing_cycle: "Monthly", subscription_status: "Active", auto_renew: true, end_date: "" });
      }
    }
  }, [open, subscription, presetOrgId, reset]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, plan_id: Number(data.plan_id), organization_id: Number(data.organization_id), end_date: data.end_date || undefined };
      if (isEdit && subscription) return subscriptionService.update(subscription.uuid, payload);
      return subscriptionService.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subscriptions"] }); onClose(); },
  });

  const plans = plansData?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Subscription" : "Create Subscription"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {!presetOrgId && (
            <div className="space-y-1">
              <Label>Organization ID</Label>
              <Input {...register("organization_id")} type="number" className="bg-background border-border" />
            </div>
          )}
          <div className="space-y-1">
            <Label>Plan</Label>
            <Select value={String(watch("plan_id"))} onValueChange={(v) => setValue("plan_id", Number(v) as any)}>
              <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select plan..." /></SelectTrigger>
              <SelectContent className="bg-surface border-border">
                {plans.map((p) => <SelectItem key={p.uuid} value={String(p.id)}>{p.plan_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Billing Cycle</Label>
              <Select value={watch("billing_cycle")} onValueChange={(v) => setValue("billing_cycle", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  {BILLING_CYCLES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={watch("subscription_status")} onValueChange={(v) => setValue("subscription_status", v)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-surface border-border">
                    {SUBSCRIPTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <Label>End Date (optional)</Label>
            <Input {...register("end_date")} type="date" className="bg-background border-border" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Auto Renew</span>
            <Switch checked={watch("auto_renew")} onCheckedChange={(v) => setValue("auto_renew", v)} />
          </div>
          {mutation.error && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
