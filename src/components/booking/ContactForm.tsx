"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  customerName: z.string().trim().min(1, "Name is required"),
  customerEmail: z.string().trim().email("Enter a valid email"),
  customerPhone: z.string().trim().optional(),
  customerNotes: z.string().trim().optional(),
});
export type ContactFormValues = z.infer<typeof schema>;

export function ContactForm({
  requirePhone,
  submitting,
  onSubmit,
  onBack,
}: {
  requirePhone: boolean;
  submitting: boolean;
  onSubmit: (values: ContactFormValues) => void;
  onBack: () => void;
}) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(
      requirePhone ? schema.extend({ customerPhone: z.string().trim().min(7, "Enter a valid phone number") }) : schema
    ),
    defaultValues: { customerName: "", customerEmail: "", customerPhone: "", customerNotes: "" },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="customerName">Full name</Label>
        <Input id="customerName" autoComplete="name" {...form.register("customerName")} />
        {form.formState.errors.customerName && (
          <p className="text-xs text-destructive">{form.formState.errors.customerName.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customerEmail">Email</Label>
        <Input id="customerEmail" type="email" autoComplete="email" {...form.register("customerEmail")} />
        {form.formState.errors.customerEmail && (
          <p className="text-xs text-destructive">{form.formState.errors.customerEmail.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customerPhone">Phone {requirePhone ? "" : <span className="text-muted-foreground">(optional)</span>}</Label>
        <Input id="customerPhone" type="tel" autoComplete="tel" {...form.register("customerPhone")} />
        {form.formState.errors.customerPhone && (
          <p className="text-xs text-destructive">{form.formState.errors.customerPhone.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="customerNotes">Notes <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea id="customerNotes" placeholder="Anything we should know before your visit?" {...form.register("customerNotes")} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="submit" variant="brand" className="flex-1" disabled={submitting}>
          {submitting ? "Booking…" : "Confirm booking"}
        </Button>
      </div>
    </form>
  );
}
