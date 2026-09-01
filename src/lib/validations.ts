import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Escribe un correo electrónico válido");
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Escribe un número de teléfono válido")
  .max(20, "Escribe un número de teléfono válido");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const createBookingSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Hora de inicio inválida" }),
  customerName: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  customerEmail: emailSchema,
  customerPhone: z.string().trim().max(20).optional().or(z.literal("")),
  customerNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const availabilityQuerySchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1),
  staffId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD"),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(5).max(60 * 8),
  price: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").optional(),
  active: z.boolean().optional(),
  staffIds: z.array(z.string()).optional(),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const staffSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  email: emailSchema.optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido").optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(z.string()).optional(),
});
export type StaffInput = z.infer<typeof staffSchema>;

export const availabilityBlockSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(24 * 60),
  endMinute: z.number().int().min(0).max(24 * 60),
});

export const weeklyAvailabilitySchema = z.object({
  blocks: z.array(availabilityBlockSchema),
});

export const timeOffSchema = z.object({
  staffId: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allDay: z.boolean().default(true),
  startMinute: z.number().int().min(0).max(24 * 60).optional().nullable(),
  endMinute: z.number().int().min(0).max(24 * 60).optional().nullable(),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

export const adminCreateBookingSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime(),
  customerName: z.string().trim().min(1).max(120),
  customerEmail: emailSchema,
  customerPhone: z.string().trim().max(20).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"]).optional(),
});

/** Shared by the creator wizard at /setup and inside the admin console. */
export const createAgendaSchema = z.object({
  industryKey: z.string().min(1, "Elige el sector del negocio"),
  businessName: z.string().trim().min(2, "Escribe el nombre del negocio").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "La dirección web es muy corta")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa solo letras, números y guiones"),

  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  fontFamily: z.enum(["inter", "poppins", "montserrat", "playfair", "system", "serif", "mono"]),
  cornerStyle: z.enum(["sharp", "soft", "round"]),
  themeMode: z.enum(["light", "dark"]),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  heroImageUrl: z.string().trim().max(500).optional().or(z.literal("")),

  heroHeadline: z.string().trim().max(200).optional().or(z.literal("")),
  heroSubheadline: z.string().trim().max(300).optional().or(z.literal("")),

  city: z.string().trim().max(120).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),

  openDays: z.array(z.number().int().min(0).max(6)).min(1, "Elige al menos un día de atención"),
  openFromMinute: z.coerce.number().int().min(0).max(24 * 60),
  openToMinute: z.coerce.number().int().min(0).max(24 * 60),

  staffNames: z.array(z.string().trim().max(120)).optional(),

  listed: z.boolean().optional(),
  /** Off for a demo (the platform account already reaches it). */
  createOwnerUser: z.boolean().optional(),
  ownerEmail: emailSchema.optional().or(z.literal("")),
  ownerPassword: z.string().max(200).optional().or(z.literal("")),
}).refine((d) => d.openToMinute > d.openFromMinute, {
  message: "La hora de cierre debe ser posterior a la de apertura",
  path: ["openToMinute"],
}).refine((d) => !d.createOwnerUser || (d.ownerEmail && (d.ownerPassword?.length ?? 0) >= 8), {
  message: "Para un acceso propio necesitas correo y una contraseña de mínimo 8 caracteres",
  path: ["ownerPassword"],
});
export type CreateAgendaInput = z.infer<typeof createAgendaSchema>;

/** The signed-in person's own profile — not the business's. */
export const accountProfileSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(120),
  email: emailSchema,
});

export const accountPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual"),
    newPassword: z.string().min(8, "La nueva contraseña debe tener mínimo 8 caracteres").max(200),
    confirmPassword: z.string().min(1, "Repite la nueva contraseña"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "La dirección web debe tener al menos 2 caracteres")
    .max(60, "La dirección web es demasiado larga")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Usa solo letras, números y guiones (por ejemplo: salon-aurora)"),
  listed: z.boolean().optional(),
  timezone: z.string().min(1),
  contactEmail: emailSchema.optional().or(z.literal("")),
  contactPhone: z.string().trim().max(30).optional().or(z.literal("")),
  whatsappNumber: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  website: z.string().trim().max(300).optional().or(z.literal("")),
  instagramUrl: z.string().trim().max(300).optional().or(z.literal("")),
  facebookUrl: z.string().trim().max(300).optional().or(z.literal("")),
  heroHeadline: z.string().trim().max(200).optional().or(z.literal("")),
  heroSubheadline: z.string().trim().max(300).optional().or(z.literal("")),
  aboutText: z.string().trim().max(3000).optional().or(z.literal("")),
  bookingSlotIntervalMinutes: z.coerce.number().int().min(5).max(120),
  bookingBufferMinutes: z.coerce.number().int().min(0).max(120),
  minNoticeMinutes: z.coerce.number().int().min(0).max(60 * 24 * 14),
  maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  requirePhone: z.boolean().optional(),
  cancellationWindowHours: z.coerce.number().int().min(0).max(24 * 30),
});

export const brandingSchema = z.object({
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  faviconUrl: z.string().trim().max(500).optional().or(z.literal("")),
  heroImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  fontFamily: z.enum(["inter", "poppins", "montserrat", "playfair", "system", "serif", "mono"]),
  cornerStyle: z.enum(["sharp", "soft", "round"]),
  themeMode: z.enum(["light", "dark", "auto"]),
});
