import { format } from "date-fns";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeOffManager } from "@/components/admin/TimeOffManager";
import { GeneralForm } from "./GeneralForm";
import { BrandingForm } from "./BrandingForm";

export default async function SettingsPage() {
  const business = await getBusiness();
  const holidays = await prisma.timeOff.findMany({
    where: { staffId: null, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Everything here drives what customers see — no code changes needed.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="holidays">Holidays</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <GeneralForm
                initial={{
                  name: business.name,
                  timezone: business.timezone,
                  currency: business.currency,
                  contactEmail: business.contactEmail ?? "",
                  contactPhone: business.contactPhone ?? "",
                  address: business.address ?? "",
                  website: business.website ?? "",
                  instagramUrl: business.instagramUrl ?? "",
                  facebookUrl: business.facebookUrl ?? "",
                  heroHeadline: business.heroHeadline ?? "",
                  heroSubheadline: business.heroSubheadline ?? "",
                  aboutText: business.aboutText ?? "",
                  bookingSlotIntervalMinutes: business.bookingSlotIntervalMinutes,
                  bookingBufferMinutes: business.bookingBufferMinutes,
                  minNoticeMinutes: business.minNoticeMinutes,
                  maxAdvanceDays: business.maxAdvanceDays,
                  requirePhone: business.requirePhone,
                  cancellationWindowHours: business.cancellationWindowHours,
                }}
              />
            </TabsContent>
            <TabsContent value="branding">
              <BrandingForm
                initial={{
                  logoUrl: business.logoUrl ?? "",
                  faviconUrl: business.faviconUrl ?? "",
                  primaryColor: business.primaryColor,
                  accentColor: business.accentColor,
                  fontFamily: business.fontFamily as "inter" | "system" | "serif" | "mono",
                  themeMode: business.themeMode as "light" | "dark" | "auto",
                }}
              />
            </TabsContent>
            <TabsContent value="holidays">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base">Business-wide holidays</CardTitle>
                  <CardDescription>Closes the whole business — every staff member — for the day.</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <TimeOffManager
                    staffId={null}
                    entries={holidays.map((h) => ({
                      id: h.id,
                      date: format(h.date, "yyyy-MM-dd"),
                      allDay: h.allDay,
                      startMinute: h.startMinute,
                      endMinute: h.endMinute,
                      reason: h.reason,
                    }))}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
