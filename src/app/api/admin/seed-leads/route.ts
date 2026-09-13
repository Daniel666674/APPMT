import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { provisionBusiness } from "@/lib/provision";
import { slugify } from "@/lib/business";
import { getIndustry } from "@/lib/industries";

/**
 * One-time bulk import for a batch of sales-prospecting leads. Protected by
 * SETUP_SECRET so it can be triggered with a plain browser GET (no terminal,
 * no client needed) — meant to be visited once, then forgotten.
 *
 * Each lead gets its OWN services (not the generic industry preset) and, when
 * known, its real owner as the staff member — so the demo reads as "your
 * business" rather than a re-skinned template. Pricing/duration/color per
 * service still borrows from the industry preset, since that's tuned per
 * vertical and the leads don't specify it.
 *
 * Idempotent: a lead whose slug already exists is skipped, so revisiting the
 * link after a partial run only creates what's missing.
 */
const LEADS: {
  name: string;
  slug: string;
  industryKey: string;
  primaryColor: string;
  accentColor: string;
  city: string;
  services: string;
  ownerName?: string;
}[] = [
  { name: "El Cielo barbershop", slug: "el-cielo-barbershop", industryKey: "barberia", primaryColor: "#6D4937", accentColor: "#D6B08A", city: "Bogotá", services: "Corte, Barba, Diseño de cejas" },
  { name: "Supreme Pro Barberia - Universidad Nacional", slug: "supreme-pro-barberia", industryKey: "barberia", primaryColor: "#7C4E42", accentColor: "#D0A58D", city: "Bogotá", services: "Corte masculino, Barba, Diseño" },
  { name: "Mad Men Barber Shop", slug: "mad-men-barber-shop", industryKey: "barberia", primaryColor: "#75513E", accentColor: "#CBA77D", city: "Bogotá", services: "Fade, Barba, Arreglo masculino" },
  { name: "Bastards Barbería | Sede Galerias", slug: "bastards-barberia", industryKey: "barberia", primaryColor: "#8B5742", accentColor: "#D9AD8D", city: "Bogotá", services: "Corte, Barba, Grooming masculino" },
  { name: "El Cielo barbershop", slug: "el-cielo-barbershop-2", industryKey: "barberia", primaryColor: "#79513F", accentColor: "#C9A37E", city: "Bogotá", services: "Corte, Barba, Styling masculino" },
  { name: "Presidential Barber Studio", slug: "presidential-barber-studio", industryKey: "barberia", primaryColor: "#765044", accentColor: "#D1AA8B", city: "Bogotá", services: "Corte, Barba, Grooming" },
  { name: "ICONIC BARBER", slug: "iconic-barber", industryKey: "barberia", primaryColor: "#7D4E39", accentColor: "#D8AD88", city: "Bogotá", services: "Corte, Barba, Perfilado" },
  { name: "MAN TO ACE Barber Shop", slug: "man-to-ace-barber-shop", industryKey: "barberia", primaryColor: "#684E42", accentColor: "#D0B08F", city: "Bogotá", services: "Corte, Barba, Manicure masculina" },
  { name: "Mero Lindo Barber", slug: "mero-lindo-barber", industryKey: "barberia", primaryColor: "#80613D", accentColor: "#DAC198", city: "Bogotá", services: "Corte, Barba, Spa masculino", ownerName: "Geyner" },
  { name: "INFINITY", slug: "infinity-peluqueria", industryKey: "peluqueria", primaryColor: "#6F3E56", accentColor: "#D5AABC", city: "Bogotá", services: "Color, Corte, Manicure", ownerName: "Carolina" },
  { name: "Ana Molano Peluquería", slug: "ana-molano-peluqueria", industryKey: "peluqueria", primaryColor: "#9C5C68", accentColor: "#E4B8BD", city: "Bogotá", services: "Colorimetría, Manicure, Tratamientos capilares", ownerName: "Ana" },
  { name: "José Peluquería by Beautysync", slug: "jose-peluqueria", industryKey: "peluqueria", primaryColor: "#876047", accentColor: "#D8B392", city: "Bogotá", services: "Balayage, Barbería, Manicure", ownerName: "José" },
  { name: "John Navas Studio", slug: "john-navas-studio", industryKey: "peluqueria", primaryColor: "#8C5A4A", accentColor: "#D9B19D", city: "Bogotá", services: "Corte, Color, Tratamientos capilares", ownerName: "John" },
  { name: "4EVER STUDIO By: Jorge Lerma", slug: "4ever-studio-jorge-lerma", industryKey: "peluqueria", primaryColor: "#79516B", accentColor: "#D0A9C2", city: "Bogotá", services: "Corte, Color, Styling", ownerName: "Jorge" },
  { name: "Lolas New Concept - Peluquería", slug: "lolas-new-concept", industryKey: "peluqueria", primaryColor: "#9B5366", accentColor: "#E3B8C0", city: "Bogotá", services: "Corte, Color, Tratamientos capilares" },
  { name: "Beauty Studio - Sede Retiro", slug: "beauty-studio-retiro", industryKey: "unas", primaryColor: "#9B4967", accentColor: "#E4B0BF", city: "Bogotá", services: "Uñas, Cejas, Pestañas" },
  { name: "Beauty Studio - Sede Modelia", slug: "beauty-studio-modelia", industryKey: "unas", primaryColor: "#92505F", accentColor: "#E0B5BA", city: "Bogotá", services: "Manicure, Pestañas, Cejas" },
  { name: "Ooh Lala nails studio", slug: "ooh-lala-nails", industryKey: "unas", primaryColor: "#A05270", accentColor: "#E7BAC9", city: "Bogotá", services: "Manicure, Pedicure, Nail art" },
  { name: "Lovely Nails", slug: "lovely-nails", industryKey: "unas", primaryColor: "#9E5274", accentColor: "#E8BDC9", city: "Bogotá", services: "Manicure, Pedicure, Uñas esculpidas" },
  { name: "Imuba Nails Colombia Sede Castilla", slug: "imuba-nails-castilla", industryKey: "unas", primaryColor: "#8F5C72", accentColor: "#D9B5C8", city: "Bogotá", services: "Manicure, Pedicure, Uñas artificiales" },
  { name: "Happy Nails & Spa", slug: "happy-nails-spa", industryKey: "unas", primaryColor: "#B05A75", accentColor: "#E8C2CA", city: "Bogotá", services: "Manicure, Pedicure, Tratamientos de spa" },
  { name: "Glam Spa Bogotá", slug: "glam-spa-bogota", industryKey: "estetica", primaryColor: "#9A536C", accentColor: "#E1B4BF", city: "Bogotá", services: "Cejas, Pestañas, Depilación" },
  { name: "Facialtec", slug: "facialtec", industryKey: "estetica", primaryColor: "#8A5363", accentColor: "#E1B6C0", city: "Bogotá", services: "Tratamientos faciales, Pestañas, Micropigmentación" },
  { name: "Microblading Bogota", slug: "microblading-bogota", industryKey: "estetica", primaryColor: "#835263", accentColor: "#D9B4BC", city: "Bogotá", services: "Microblading, Cejas, Micropigmentación" },
  { name: "Depibel Skin", slug: "depibel-skin", industryKey: "estetica", primaryColor: "#9B655A", accentColor: "#E3C0AE", city: "Bogotá", services: "Depilación con cera, Depilación corporal, Cuidado facial" },
  { name: "Centro de Depilación LM", slug: "centro-depilacion-lm", industryKey: "estetica", primaryColor: "#8F6054", accentColor: "#DFBCAC", city: "Bogotá", services: "Depilación corporal, Depilación facial, Cejas" },
  { name: "Wellness Spa Movil", slug: "wellness-spa-movil", industryKey: "spa", primaryColor: "#69714E", accentColor: "#D6D4AF", city: "Bogotá", services: "Masajes, Relajación, Bienestar corporal" },
  { name: "Baw Thai Spa - Santa Barbara", slug: "baw-thai-spa", industryKey: "spa", primaryColor: "#806244", accentColor: "#D9BD90", city: "Bogotá", services: "Masaje tailandés, Masaje relajante, Rituales corporales" },
  { name: "BogoTHAI Massage & Spa. Usaquen Cl.109", slug: "bogothai-massage-spa", industryKey: "spa", primaryColor: "#75573E", accentColor: "#D6B986", city: "Bogotá", services: "Masaje tailandés, Masaje relajante, Wellness" },
  { name: "masajes para ti", slug: "masajes-para-ti", industryKey: "spa", primaryColor: "#7B624D", accentColor: "#DCC9AB", city: "Bogotá", services: "Masaje relajante, Masaje terapéutico, Masajes corporales" },
  { name: "Home Massage - Masajes a Domicilio Bogotá", slug: "home-massage-bogota", industryKey: "spa", primaryColor: "#80654C", accentColor: "#DBC49E", city: "Bogotá", services: "Masaje relajante, Masaje terapéutico, Masaje en pareja" },
  { name: "Wuin Spa SAS", slug: "wuin-spa", industryKey: "spa", primaryColor: "#766047", accentColor: "#D6C19D", city: "Bogotá", services: "Masaje personalizado, Aromaterapia, Spa corporal" },
  { name: "Aqua Spa", slug: "aqua-spa", industryKey: "spa", primaryColor: "#63735C", accentColor: "#CED8BE", city: "Bogotá", services: "Spa de pies, Tratamientos corporales, Coloración" },
  { name: "Dermoestetic Medicina y Estética", slug: "dermoestetic", industryKey: "medico", primaryColor: "#8B5D67", accentColor: "#E0B8BE", city: "Bogotá", services: "Tratamientos estéticos, Faciales, Corporales" },
  { name: "Bel Medicina Estética", slug: "bel-medicina-estetica", industryKey: "medico", primaryColor: "#9B5668", accentColor: "#E5B9C0", city: "Bogotá", services: "Medicina estética, Tratamientos faciales, Tratamientos corporales" },
  { name: "Novastética", slug: "novastetica", industryKey: "estetica", primaryColor: "#885765", accentColor: "#DFBBC3", city: "Bogotá", services: "Medicina estética, Tratamientos faciales, Tratamientos corporales" },
  { name: "Trece Tattoo Bogota", slug: "trece-tattoo", industryKey: "tatuajes", primaryColor: "#704A60", accentColor: "#C8A0BA", city: "Bogotá", services: "Tatuajes personalizados, Blackwork, Realismo" },
  { name: "Tattoo DC Studio", slug: "tattoo-dc-studio", industryKey: "tatuajes", primaryColor: "#76516B", accentColor: "#CBA9C2", city: "Bogotá", services: "Tatuaje personalizado, Blackwork, Fine line" },
  { name: "BOGOTA TATTOO", slug: "bogota-tattoo", industryKey: "tatuajes", primaryColor: "#704D61", accentColor: "#C8A6B8", city: "Bogotá", services: "Tatuajes personalizados, Realismo, Blackwork" },
  { name: "HOME TATTOO BOGOTÁ", slug: "home-tattoo-bogota", industryKey: "tatuajes", primaryColor: "#7C5369", accentColor: "#D1A8BE", city: "Bogotá", services: "Tatuajes personalizados, Lettering, Blackwork" },
  { name: "Ulai Pilates Reformer Bulevar", slug: "ulai-pilates", industryKey: "fitness", primaryColor: "#68714F", accentColor: "#D0D6B3", city: "Bogotá", services: "Pilates reformer, Entrenamiento personalizado, Clases grupales" },
  { name: "Pulse pilates studio", slug: "pulse-pilates-studio", industryKey: "fitness", primaryColor: "#8A6651", accentColor: "#D9C0A4", city: "Bogotá", services: "Pilates reformer, Movilidad, Entrenamiento funcional" },
  { name: "Aima Pilates Studio Bogotá", slug: "aima-pilates", industryKey: "fitness", primaryColor: "#737957", accentColor: "#D5D9BA", city: "Bogotá", services: "Pilates, Movilidad, Entrenamiento personalizado" },
  { name: "BiFit Boutique Fitness EMS", slug: "bifit-fitness", industryKey: "fitness", primaryColor: "#735C50", accentColor: "#D6B59D", city: "Bogotá", services: "EMS, Entrenamiento personalizado, Acondicionamiento físico" },
  { name: "Fisioterapia Bogotá — Sandra Rincón", slug: "fisioterapia-sandra-rincon", industryKey: "fisioterapia", primaryColor: "#567568", accentColor: "#C0D6C8", city: "Bogotá", services: "Fisioterapia, Rehabilitación, Terapia física", ownerName: "Sandra Rincón" },
  { name: "Nutryfit — Diana Rojas", slug: "nutryfit-diana-rojas", industryKey: "medico", primaryColor: "#788253", accentColor: "#D7DBB7", city: "Bogotá", services: "Nutrición, Medicina funcional, Seguimiento nutricional", ownerName: "Diana Rojas" },
  { name: "Psicólogos Bogotá — Cuerpo, Arte y Palabra", slug: "psicologos-bogota", industryKey: "psicologia", primaryColor: "#755B69", accentColor: "#D6B7C6", city: "Bogotá", services: "Psicoterapia individual, Terapia de pareja, Psicología infantil" },
  { name: "AZ Máxima Visión — Dra. Carolina Zúñiga", slug: "az-maxima-vision", industryKey: "medico", primaryColor: "#61796D", accentColor: "#C2D6CC", city: "Bogotá", services: "Optometría, Ortóptica, Queratocono", ownerName: "Dra. Carolina Zúñiga" },
  { name: "Clínica Déntica by Cristina Suaza", slug: "clinica-dentica", industryKey: "dental", primaryColor: "#7C6270", accentColor: "#D5BDCA", city: "Bogotá", services: "Odontología general, Estética dental, Rehabilitación", ownerName: "Cristina Suaza" },
  { name: "Unidad Odontofacial", slug: "unidad-odontofacial", industryKey: "dental", primaryColor: "#80656F", accentColor: "#D8BEC9", city: "Bogotá", services: "Implantes, Ortodoncia, Diseño de sonrisa" },
];

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.SETUP_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Clave de instalación incorrecta." }, { status: 401 });
  }

  const created: string[] = [];
  const skipped: string[] = [];
  const failed: { name: string; reason: string }[] = [];

  for (const lead of LEADS) {
    const slug = slugify(lead.slug);
    const exists = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (exists) {
      skipped.push(slug);
      continue;
    }
    try {
      const result = await provisionBusiness(prisma, {
        businessName: lead.name,
        slug,
        industryKey: lead.industryKey,
        primaryColor: lead.primaryColor,
        accentColor: lead.accentColor,
        city: lead.city,
        staffNames: lead.ownerName ? [lead.ownerName] : undefined,
        createOwnerUser: false,
        listed: true,
        withSampleBooking: false,
      });

      await replaceWithRealServices(result.businessId, lead.industryKey, lead.services);

      created.push(result.slug);
    } catch (err) {
      failed.push({ name: lead.name, reason: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({
    createdCount: created.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    created,
    skipped,
    failed,
  });
}

/**
 * Swaps the generic industry-preset services provisionBusiness just created
 * for the lead's actual named services, borrowing duration/price/color from
 * the same preset (cycling through it) since the lead data doesn't specify
 * those and the preset values are already tuned per vertical.
 */
async function replaceWithRealServices(businessId: string, industryKey: string, servicesCsv: string) {
  const industry = getIndustry(industryKey);
  const names = servicesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length === 0) return;

  await prisma.service.deleteMany({ where: { businessId } });

  const staff = await prisma.staff.findMany({ where: { businessId }, select: { id: true } });

  for (const [index, name] of names.entries()) {
    const template = industry.services[index % industry.services.length]!;
    const service = await prisma.service.create({
      data: {
        businessId,
        name,
        description: template.description,
        durationMinutes: template.durationMinutes,
        price: template.price,
        color: template.color,
        sortOrder: index,
        active: true,
      },
    });
    for (const member of staff) {
      await prisma.serviceStaff.create({ data: { serviceId: service.id, staffId: member.id } });
    }
  }
}
