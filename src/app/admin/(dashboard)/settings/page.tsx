import { format } from "date-fns";
import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeOffManager } from "@/components/admin/TimeOffManager";
import { GeneralForm } from "./GeneralForm";
import { BrandingForm } from "./BrandingForm";

export default async function SettingsPage() {
  const { business, businessId } = await requireBusinessSession();
  const [holidays, services] = await Promise.all([
    prisma.timeOff.findMany({
      where: { businessId, staffId: null, date: { gte: new Date() } },
      orderBy: { date: "asc" },
    }),
    // Feeds the branding preview with this business's real services.
    prisma.service.findMany({
      where: { businessId, active: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">Todo lo de aquí define lo que ven tus clientes. No hace falta tocar código.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Marca</TabsTrigger>
              <TabsTrigger value="holidays">Festivos</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <GeneralForm
                initial={{
                  name: business.name,
                  slug: business.slug,
                  listed: business.listed,
                  timezone: business.timezone,
                  contactEmail: business.contactEmail ?? "",
                  contactPhone: business.contactPhone ?? "",
                  whatsappNumber: business.whatsappNumber ?? "",
                  address: business.address ?? "",
                  city: business.city ?? "",
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
                businessId={businessId}
                initial={{
                  logoUrl: business.logoUrl ?? "",
                  faviconUrl: business.faviconUrl ?? "",
                  heroImageUrl: business.heroImageUrl ?? "",
                  primaryColor: business.primaryColor,
                  accentColor: business.accentColor,
                  fontFamily: business.fontFamily,
                  cornerStyle: business.cornerStyle,
                  themeMode: business.themeMode === "dark" ? "dark" : "light",
                }}
                context={{
                  businessName: business.name,
                  slug: business.slug,
                  heroHeadline: business.heroHeadline ?? `Agenda tu cita en ${business.name}`,
                  heroSubheadline: business.heroSubheadline ?? "",
                  whatsappNumber: business.whatsappNumber ?? "",
                  contactPhone: business.contactPhone ?? "",
                  services: services.map((s) => ({
                    name: s.name,
                    description: s.description ?? "",
                    durationMinutes: s.durationMinutes,
                    price: Number(s.price ?? 0),
                  })),
                }}
              />
            </TabsContent>
            <TabsContent value="holidays">
              <Card className="border-0 shadow-none">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-base">Días festivos del negocio</CardTitle>
                  <CardDescription>Cierra el negocio completo, para todo el equipo, ese día.</CardDescription>
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
