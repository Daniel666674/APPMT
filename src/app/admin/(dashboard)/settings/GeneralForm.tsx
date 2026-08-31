"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateBusinessProfile } from "./actions";

interface Props {
  name: string;
  timezone: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  bookingSlotIntervalMinutes: number;
  bookingBufferMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  requirePhone: boolean;
  cancellationWindowHours: number;
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "UTC",
];

export function GeneralForm({ initial }: { initial: Props }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Props>(key: K, value: Props[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBusinessProfile(values);
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Business profile</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone</Label>
            <select
              id="timezone"
              value={values.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency (ISO code)</Label>
            <Input id="currency" value={values.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input id="contactEmail" type="email" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input id="contactPhone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" value={values.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input id="instagramUrl" value={values.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input id="facebookUrl" value={values.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Booking page copy</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="heroHeadline">Headline</Label>
            <Input
              id="heroHeadline"
              value={values.heroHeadline}
              onChange={(e) => set("heroHeadline", e.target.value)}
              placeholder={`Book your appointment with ${values.name}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="heroSubheadline">Subheadline</Label>
            <Input id="heroSubheadline" value={values.heroSubheadline} onChange={(e) => set("heroSubheadline", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aboutText">About section</Label>
            <Textarea id="aboutText" rows={4} value={values.aboutText} onChange={(e) => set("aboutText", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Booking rules</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slotInterval">Time slot interval (minutes)</Label>
            <Input
              id="slotInterval"
              type="number"
              min={5}
              step={5}
              value={values.bookingSlotIntervalMinutes}
              onChange={(e) => set("bookingSlotIntervalMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buffer">Buffer between appointments (minutes)</Label>
            <Input
              id="buffer"
              type="number"
              min={0}
              step={5}
              value={values.bookingBufferMinutes}
              onChange={(e) => set("bookingBufferMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minNotice">Minimum notice (minutes)</Label>
            <Input
              id="minNotice"
              type="number"
              min={0}
              value={values.minNoticeMinutes}
              onChange={(e) => set("minNoticeMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxAdvance">Max days in advance</Label>
            <Input
              id="maxAdvance"
              type="number"
              min={1}
              value={values.maxAdvanceDays}
              onChange={(e) => set("maxAdvanceDays", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancelWindow">Cancellation window (hours)</Label>
            <Input
              id="cancelWindow"
              type="number"
              min={0}
              value={values.cancellationWindowHours}
              onChange={(e) => set("cancellationWindowHours", Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={values.requirePhone} onCheckedChange={(v) => set("requirePhone", v)} />
            <Label>Require phone number at booking</Label>
          </div>
        </div>
      </section>

      <Button type="submit" variant="brand" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
