import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Enter a valid phone number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1),
  startsAt: z.string().datetime({ message: "Invalid start time" }),
  customerName: z.string().trim().min(1, "Name is required").max(120),
  customerEmail: emailSchema,
  customerPhone: z.string().trim().max(20).optional().or(z.literal("")),
  customerNotes: z.string().trim().max(1000).optional().or(z.literal("")),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const availabilityQuerySchema = z.object({
  serviceId: z.string().min(1),
  staffId: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
});

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional().or(z.literal("")),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(5).max(60 * 8),
  price: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").optional(),
  active: z.boolean().optional(),
  staffIds: z.array(z.string()).optional(),
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const staffSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: emailSchema.optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").optional(),
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

export const businessSettingsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  timezone: z.string().min(1),
  currency: z.string().min(1).max(10),
  contactEmail: emailSchema.optional().or(z.literal("")),
  contactPhone: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
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
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color"),
  fontFamily: z.enum(["inter", "system", "serif", "mono"]),
  themeMode: z.enum(["light", "dark", "auto"]),
});
