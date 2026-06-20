"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { featureService } from "@/services/plans.service";
import type { Feature } from "@/types/plan.types";
import { FEATURE_CATEGORIES } from "@/types/plan.types";

const schema = z.object({
  feature_name: z.string().min(1),
  feature_code: z.string().min(1).regex(/^[A-Z0-9_]+$/, "SCREAMING_SNAKE_CASE only"),
  description: z.string().optional(),
  category: z.string().min(1),
  status: z.enum(["active", "inactive"]),
});
type FormValues = z.infer<typeof schema>;

interface Props { open: boolean; onClose: () => void; feature?: Feature | null }

export function FeatureFormDialog({ open, onClose, feature }: Props) {
  const qc = useQueryClient();
  const isEdit = !!feature;
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { feature_name: "", feature_code: "", description: "", category: "General", status: "active" },
  });

  useEffect(() => {
    if (open) {
      if (feature) {
        reset({ feature_name: feature.feature_name, feature_code: feature.feature_code, description: feature.description ?? "", category: feature.category, status: feature.status });
      } else {
        reset({ feature_name: "", feature_code: "", description: "", category: "General", status: "active" });
      }
    }
  }, [open, feature, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => isEdit && feature ? featureService.update(feature.uuid, data) : featureService.create(data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["features"] }); onClose(); },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-surface border-border">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Feature" : "Create Feature"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Feature Name</Label>
              <Input {...register("feature_name")} className="bg-background border-border" placeholder="AI Reporting" />
              {errors.feature_name && <p className="text-xs text-destructive">{errors.feature_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Feature Code {isEdit && <span className="text-muted-foreground">(read-only)</span>}</Label>
              <Input {...register("feature_code")} disabled={isEdit} className="bg-background border-border" placeholder="AI_REPORTING" />
              {errors.feature_code && <p className="text-xs text-destructive">{errors.feature_code.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register("description")} className="bg-background border-border resize-none" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  {FEATURE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as any)}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-surface border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {mutation.error && <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {mutation.isPending ? "Saving..." : isEdit ? "Save" : "Create Feature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
