import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { provisionBusiness } from "@/lib/provision";
import { slugify } from "@/lib/business";

/**
 * One-time bulk import for a batch of sales-prospecting leads. Protected by
 * SETUP_SECRET so it can be triggered with a plain browser GET (no terminal,
 * no client needed) — meant to be visited once, then forgotten.
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
}[] = [
  { name: "El Cielo barbershop", slug: "el-cielo-barbershop", industryKey: "barberia", primaryColor: "#6D4937", accentColor: "#D6B08A", city: "Bogotá" },
  { name: "Supreme Pro Barberia - Universidad Nacional", slug: "supreme-pro-barberia", industryKey: "barberia", primaryColor: "#7C4E42", accentColor: "#D0A58D", city: "Bogotá" },
  { name: "Mad Men Barber Shop", slug: "mad-men-barber-shop", industryKey: "barberia", primaryColor: "#75513E", accentColor: "#CBA77D", city: "Bogotá" },
  { name: "Bastards Barbería | Sede Galerias", slug: "bastards-barberia", industryKey: "barberia", primaryColor: "#8B5742", accentColor: "#D9AD8D", city: "Bogotá" },
  { name: "El Cielo barbershop", slug: "el-cielo-barbershop-2", industryKey: "barberia", primaryColor: "#79513F", accentColor: "#C9A37E", city: "Bogotá" },
  { name: "Presidential Barber Studio", slug: "presidential-barber-studio", industryKey: "barberia", primaryColor: "#765044", accentColor: "#D1AA8B", city: "Bogotá" },
  { name: "ICONIC BARBER", slug: "iconic-barber", industryKey: "barberia", primaryColor: "#7D4E39", accentColor: "#D8AD88", city: "Bogotá" },
  { name: "MAN TO ACE Barber Shop", slug: "man-to-ace-barber-shop", industryKey: "barberia", primaryColor: "#684E42", accentColor: "#D0B08F", city: "Bogotá" },
  { name: "Mero Lindo Barber", slug: "mero-lindo-barber", industryKey: "barberia", primaryColor: "#80613D", accentColor: "#DAC198", city: "Bogotá" },
  { name: "INFINITY", slug: "infinity-peluqueria", industryKey: "peluqueria", primaryColor: "#6F3E56", accentColor: "#D5AABC", city: "Bogotá" },
  { name: "Ana Molano Peluquería", slug: "ana-molano-peluqueria", industryKey: "peluqueria", primaryColor: "#9C5C68", accentColor: "#E4B8BD", city: "Bogotá" },
  { name: "José Peluquería by Beautysync", slug: "jose-peluqueria", industryKey: "peluqueria", primaryColor: "#876047", accentColor: "#D8B392", city: "Bogotá" },
  { name: "John Navas Studio", slug: "john-navas-studio", industryKey: "peluqueria", primaryColor: "#8C5A4A", accentColor: "#D9B19D", city: "Bogotá" },
  { name: "4EVER STUDIO By: Jorge Lerma", slug: "4ever-studio-jorge-lerma", industryKey: "peluqueria", primaryColor: "#79516B", accentColor: "#D0A9C2", city: "Bogotá" },
  { name: "Lolas New Concept - Peluquería", slug: "lolas-new-concept", industryKey: "peluqueria", primaryColor: "#9B5366", accentColor: "#E3B8C0", city: "Bogotá" },
  { name: "Beauty Studio - Sede Retiro", slug: "beauty-studio-retiro", industryKey: "unas", primaryColor: "#9B4967", accentColor: "#E4B0BF", city: "Bogotá" },
  { name: "Beauty Studio - Sede Modelia", slug: "beauty-studio-modelia", industryKey: "unas", primaryColor: "#92505F", accentColor: "#E0B5BA", city: "Bogotá" },
  { name: "Ooh Lala nails studio", slug: "ooh-lala-nails", industryKey: "unas", primaryColor: "#A05270", accentColor: "#E7BAC9", city: "Bogotá" },
  { name: "Lovely Nails", slug: "lovely-nails", industryKey: "unas", primaryColor: "#9E5274", accentColor: "#E8BDC9", city: "Bogotá" },
  { name: "Imuba Nails Colombia Sede Castilla", slug: "imuba-nails-castilla", industryKey: "unas", primaryColor: "#8F5C72", accentColor: "#D9B5C8", city: "Bogotá" },
  { name: "Happy Nails & Spa", slug: "happy-nails-spa", industryKey: "unas", primaryColor: "#B05A75", accentColor: "#E8C2CA", city: "Bogotá" },
  { name: "Glam Spa Bogotá", slug: "glam-spa-bogota", industryKey: "estetica", primaryColor: "#9A536C", accentColor: "#E1B4BF", city: "Bogotá" },
  { name: "Facialtec", slug: "facialtec", industryKey: "estetica", primaryColor: "#8A5363", accentColor: "#E1B6C0", city: "Bogotá" },
  { name: "Microblading Bogota", slug: "microblading-bogota", industryKey: "estetica", primaryColor: "#835263", accentColor: "#D9B4BC", city: "Bogotá" },
  { name: "Depibel Skin", slug: "depibel-skin", industryKey: "estetica", primaryColor: "#9B655A", accentColor: "#E3C0AE", city: "Bogotá" },
  { name: "Centro de Depilación LM", slug: "centro-depilacion-lm", industryKey: "estetica", primaryColor: "#8F6054", accentColor: "#DFBCAC", city: "Bogotá" },
  { name: "Wellness Spa Movil", slug: "wellness-spa-movil", industryKey: "spa", primaryColor: "#69714E", accentColor: "#D6D4AF", city: "Bogotá" },
  { name: "Baw Thai Spa - Santa Barbara", slug: "baw-thai-spa", industryKey: "spa", primaryColor: "#806244", accentColor: "#D9BD90", city: "Bogotá" },
  { name: "BogoTHAI Massage & Spa. Usaquen Cl.109", slug: "bogothai-massage-spa", industryKey: "spa", primaryColor: "#75573E", accentColor: "#D6B986", city: "Bogotá" },
  { name: "masajes para ti", slug: "masajes-para-ti", industryKey: "spa", primaryColor: "#7B624D", accentColor: "#DCC9AB", city: "Bogotá" },
  { name: "Home Massage - Masajes a Domicilio Bogotá", slug: "home-massage-bogota", industryKey: "spa", primaryColor: "#80654C", accentColor: "#DBC49E", city: "Bogotá" },
  { name: "Wuin Spa SAS", slug: "wuin-spa", industryKey: "spa", primaryColor: "#766047", accentColor: "#D6C19D", city: "Bogotá" },
  { name: "Aqua Spa", slug: "aqua-spa", industryKey: "spa", primaryColor: "#63735C", accentColor: "#CED8BE", city: "Bogotá" },
  { name: "Dermoestetic Medicina y Estética", slug: "dermoestetic", industryKey: "medico", primaryColor: "#8B5D67", accentColor: "#E0B8BE", city: "Bogotá" },
  { name: "Bel Medicina Estética", slug: "bel-medicina-estetica", industryKey: "medico", primaryColor: "#9B5668", accentColor: "#E5B9C0", city: "Bogotá" },
  { name: "Novastética", slug: "novastetica", industryKey: "estetica", primaryColor: "#885765", accentColor: "#DFBBC3", city: "Bogotá" },
  { name: "Trece Tattoo Bogota", slug: "trece-tattoo", industryKey: "tatuajes", primaryColor: "#704A60", accentColor: "#C8A0BA", city: "Bogotá" },
  { name: "Tattoo DC Studio", slug: "tattoo-dc-studio", industryKey: "tatuajes", primaryColor: "#76516B", accentColor: "#CBA9C2", city: "Bogotá" },
  { name: "BOGOTA TATTOO", slug: "bogota-tattoo", industryKey: "tatuajes", primaryColor: "#704D61", accentColor: "#C8A6B8", city: "Bogotá" },
  { name: "HOME TATTOO BOGOTÁ", slug: "home-tattoo-bogota", industryKey: "tatuajes", primaryColor: "#7C5369", accentColor: "#D1A8BE", city: "Bogotá" },
  { name: "Ulai Pilates Reformer Bulevar", slug: "ulai-pilates", industryKey: "fitness", primaryColor: "#68714F", accentColor: "#D0D6B3", city: "Bogotá" },
  { name: "Pulse pilates studio", slug: "pulse-pilates-studio", industryKey: "fitness", primaryColor: "#8A6651", accentColor: "#D9C0A4", city: "Bogotá" },
  { name: "Aima Pilates Studio Bogotá", slug: "aima-pilates", industryKey: "fitness", primaryColor: "#737957", accentColor: "#D5D9BA", city: "Bogotá" },
  { name: "BiFit Boutique Fitness EMS", slug: "bifit-fitness", industryKey: "fitness", primaryColor: "#735C50", accentColor: "#D6B59D", city: "Bogotá" },
  { name: "Fisioterapia Bogotá — Sandra Rincón", slug: "fisioterapia-sandra-rincon", industryKey: "fisioterapia", primaryColor: "#567568", accentColor: "#C0D6C8", city: "Bogotá" },
  { name: "Nutryfit — Diana Rojas", slug: "nutryfit-diana-rojas", industryKey: "medico", primaryColor: "#788253", accentColor: "#D7DBB7", city: "Bogotá" },
  { name: "Psicólogos Bogotá — Cuerpo, Arte y Palabra", slug: "psicologos-bogota", industryKey: "psicologia", primaryColor: "#755B69", accentColor: "#D6B7C6", city: "Bogotá" },
  { name: "AZ Máxima Visión — Dra. Carolina Zúñiga", slug: "az-maxima-vision", industryKey: "medico", primaryColor: "#61796D", accentColor: "#C2D6CC", city: "Bogotá" },
  { name: "Clínica Déntica by Cristina Suaza", slug: "clinica-dentica", industryKey: "dental", primaryColor: "#7C6270", accentColor: "#D5BDCA", city: "Bogotá" },
  { name: "Unidad Odontofacial", slug: "unidad-odontofacial", industryKey: "dental", primaryColor: "#80656F", accentColor: "#D8BEC9", city: "Bogotá" },
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
        createOwnerUser: false,
        listed: true,
        withSampleBooking: false,
      });
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
