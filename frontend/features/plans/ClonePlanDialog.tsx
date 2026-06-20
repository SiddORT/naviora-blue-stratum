"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { planService } from "@/services/plans.service";
import type { Plan } from "@/types/plan.types";

interface Props { open: boolean; onClose: () => void; plan: Plan }

export function ClonePlanDialog({ open, onClose, plan }: Props) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { plan_name: `${plan.plan_name} (Copy)`, plan_code: `${plan.plan_code}_COPY` },
  });

  const mutation = useMutation({
    mutationFn: ({ plan_name, plan_code }: { plan_name: string; plan_code: string }) =>
      planService.clone(plan.uuid, plan_name, plan_code),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plans"] }); onClose(); reset(); },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-surface border-border">
        <DialogHeader><DialogTitle>Clone Plan — {plan.plan_name}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Label>New Plan Name</Label>
            <Input {...register("plan_name", { required: true })} className="bg-background border-border" />
          </div>
          <div className="space-y-1">
            <Label>New Plan Code (uppercase, no spaces)</Label>
            <Input {...register("plan_code", { required: true, pattern: /^[A-Z0-9_\-]+$/ })} className="bg-background border-border" />
            {errors.plan_code && <p className="text-xs text-destructive">Uppercase letters, numbers, _ or - only</p>}
          </div>
          {mutation.error && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {mutation.isPending ? "Cloning..." : "Clone Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
