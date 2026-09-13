import { PrismaClient } from "@prisma/client";
import { provisionBusiness } from "../src/lib/provision";

const prisma = new PrismaClient();

const LEADS = [
  {
    name: "El Cielo barbershop",
    slug: "el-cielo-barbershop",
    primaryColor: "#6D4937",
    accentColor: "#D6B08A",
    city: "Bogotá",
    services: "Corte, barba, diseño de cejas",
  },
  {
    name: "Supreme Pro Barberia - Universidad Nacional",
    slug: "supreme-pro-barberia",
    primaryColor: "#7C4E42",
    accentColor: "#D0A58D",
    city: "Bogotá",
    services: "Corte masculino, barba, diseño",
  },
  {
    name: "Mad Men Barber Shop",
    slug: "mad-men-barber-shop",
    primaryColor: "#75513E",
    accentColor: "#CBA77D",
    city: "Bogotá",
    services: "Fade, barba, arreglo masculino",
  },
  {
    name: "Bastards Barbería | Sede Galerias",
    slug: "bastards-barberia",
    primaryColor: "#8B5742",
    accentColor: "#D9AD8D",
    city: "Bogotá",
    services: "Corte, barba, grooming masculino",
  },
  {
    name: "El Cielo barbershop",
    slug: "el-cielo-barbershop-2",
    primaryColor: "#79513F",
    accentColor: "#C9A37E",
    city: "Bogotá",
    services: "Corte, barba, styling masculino",
  },
  {
    name: "Presidential Barber Studio",
    slug: "presidential-barber-studio",
    primaryColor: "#765044",
    accentColor: "#D1AA8B",
    city: "Bogotá",
    services: "Corte, barba, grooming",
  },
  {
    name: "ICONIC BARBER",
    slug: "iconic-barber",
    primaryColor: "#7D4E39",
    accentColor: "#D8AD88",
    city: "Bogotá",
    services: "Corte, barba, perfilado",
  },
  {
    name: "MAN TO ACE Barber Shop",
    slug: "man-to-ace-barber-shop",
    primaryColor: "#684E42",
    accentColor: "#D0B08F",
    city: "Bogotá",
    services: "Corte, barba, manicure masculina",
  },
  {
    name: "Mero Lindo Barber",
    slug: "mero-lindo-barber",
    primaryColor: "#80613D",
    accentColor: "#DAC198",
    city: "Bogotá",
    services: "Corte, barba, spa masculino",
  },
  {
    name: "INFINITY",
    slug: "infinity-peluqueria",
    primaryColor: "#6F3E56",
    accentColor: "#D5AABC",
    city: "Bogotá",
    services: "Color, corte, manicure",
  },
  {
    name: "Ana Molano Peluquería",
    slug: "ana-molano-peluqueria",
    primaryColor: "#9C5C68",
    accentColor: "#E4B8BD",
    city: "Bogotá",
    services: "Colorimetría, manicure, tratamientos capilares",
  },
  {
    name: "José Peluquería by Beautysync",
    slug: "jose-peluqueria",
    primaryColor: "#876047",
    accentColor: "#D8B392",
    city: "Bogotá",
    services: "Balayage, barbería, manicure",
  },
  {
    name: "John Navas Studio",
    slug: "john-navas-studio",
    primaryColor: "#8C5A4A",
    accentColor: "#D9B19D",
    city: "Bogotá",
    services: "Corte, color, tratamientos capilares",
  },
  {
    name: "4EVER STUDIO By: Jorge Lerma",
    slug: "4ever-studio-jorge-lerma",
    primaryColor: "#79516B",
    accentColor: "#D0A9C2",
    city: "Bogotá",
    services: "Corte, color, styling",
  },
  {
    name: "Lolas New Concept - Peluquería",
    slug: "lolas-new-concept",
    primaryColor: "#9B5366",
    accentColor: "#E3B8C0",
    city: "Bogotá",
    services: "Corte, color, tratamientos capilares",
  },
  {
    name: "Beauty Studio - Sede Retiro",
    slug: "beauty-studio-retiro",
    primaryColor: "#9B4967",
    accentColor: "#E4B0BF",
    city: "Bogotá",
    services: "Uñas, cejas, pestañas",
  },
  {
    name: "Beauty Studio - Sede Modelia",
    slug: "beauty-studio-modelia",
    primaryColor: "#92505F",
    accentColor: "#E0B5BA",
    city: "Bogotá",
    services: "Manicure, pestañas, cejas",
  },
  {
    name: "Ooh Lala nails studio",
    slug: "ooh-lala-nails",
    primaryColor: "#A05270",
    accentColor: "#E7BAC9",
    city: "Bogotá",
    services: "Manicure, pedicure, nail art",
  },
  {
    name: "Lovely Nails",
    slug: "lovely-nails",
    primaryColor: "#9E5274",
    accentColor: "#E8BDC9",
    city: "Bogotá",
    services: "Manicure, pedicure, uñas esculpidas",
  },
  {
    name: "Imuba Nails Colombia Sede Castilla",
    slug: "imuba-nails-castilla",
    primaryColor: "#8F5C72",
    accentColor: "#D9B5C8",
    city: "Bogotá",
    services: "Manicure, pedicure, uñas artificiales",
  },
  {
    name: "Happy Nails & Spa",
    slug: "happy-nails-spa",
    primaryColor: "#B05A75",
    accentColor: "#E8C2CA",
    city: "Bogotá",
    services: "Manicure, pedicure, tratamientos de spa",
  },
  {
    name: "Glam Spa Bogotá",
    slug: "glam-spa-bogota",
    primaryColor: "#9A536C",
    accentColor: "#E1B4BF",
    city: "Bogotá",
    services: "Cejas, pestañas, depilación",
  },
  {
    name: "Facialtec",
    slug: "facialtec",
    primaryColor: "#8A5363",
    accentColor: "#E1B6C0",
    city: "Bogotá",
    services: "Tratamientos faciales, pestañas, micropigmentación",
  },
  {
    name: "Microblading Bogota",
    slug: "microblading-bogota",
    primaryColor: "#835263",
    accentColor: "#D9B4BC",
    city: "Bogotá",
    services: "Microblading, cejas, micropigmentación",
  },
  {
    name: "Depibel Skin",
    slug: "depibel-skin",
    primaryColor: "#9B655A",
    accentColor: "#E3C0AE",
    city: "Bogotá",
    services: "Depilación con cera, depilación corporal, cuidado facial",
  },
  {
    name: "Centro de Depilación LM",
    slug: "centro-depilacion-lm",
    primaryColor: "#8F6054",
    accentColor: "#DFBCAC",
    city: "Bogotá",
    services: "Depilación corporal, depilación facial, cejas",
  },
  {
    name: "Wellness Spa Movil",
    slug: "wellness-spa-movil",
    primaryColor: "#69714E",
    accentColor: "#D6D4AF",
    city: "Bogotá",
    services: "Masajes, relajación, bienestar corporal",
  },
  {
    name: "Baw Thai Spa - Santa Barbara",
    slug: "baw-thai-spa",
    primaryColor: "#806244",
    accentColor: "#D9BD90",
    city: "Bogotá",
    services: "Masaje tailandés, masaje relajante, rituales corporales",
  },
  {
    name: "BogoTHAI Massage & Spa. Usaquen Cl.109",
    slug: "bogothai-massage-spa",
    primaryColor: "#75573E",
    accentColor: "#D6B986",
    city: "Bogotá",
    services: "Masaje tailandés, masaje relajante, wellness",
  },
  {
    name: "masajes para ti",
    slug: "masajes-para-ti",
    primaryColor: "#7B624D",
    accentColor: "#DCC9AB",
    city: "Bogotá",
    services: "Masaje relajante, masaje terapéutico, masajes corporales",
  },
  {
    name: "Home Massage - Masajes a Domicilio Bogotá",
    slug: "home-massage-bogota",
    primaryColor: "#80654C",
    accentColor: "#DBC49E",
    city: "Bogotá",
    services: "Masaje relajante, masaje terapéutico, masaje en pareja",
  },
  {
    name: "Wuin Spa SAS",
    slug: "wuin-spa",
    primaryColor: "#766047",
    accentColor: "#D6C19D",
    city: "Bogotá",
    services: "Masaje personalizado, aromaterapia, spa corporal",
  },
  {
    name: "Aqua Spa",
    slug: "aqua-spa",
    primaryColor: "#63735C",
    accentColor: "#CED8BE",
    city: "Bogotá",
    services: "Spa de pies, tratamientos corporales, coloración",
  },
  {
    name: "Dermoestetic Medicina y Estética",
    slug: "dermoestetic",
    primaryColor: "#8B5D67",
    accentColor: "#E0B8BE",
    city: "Bogotá",
    services: "Tratamientos estéticos, faciales, corporales",
  },
  {
    name: "Bel Medicina Estética",
    slug: "bel-medicina-estetica",
    primaryColor: "#9B5668",
    accentColor: "#E5B9C0",
    city: "Bogotá",
    services: "Medicina estética, tratamientos faciales, tratamientos corporales",
  },
  {
    name: "Novastética",
    slug: "novastética",
    primaryColor: "#885765",
    accentColor: "#DFBBC3",
    city: "Bogotá",
    services: "Medicina estética, tratamientos faciales, tratamientos corporales",
  },
  {
    name: "Trece Tattoo Bogota",
    slug: "trece-tattoo",
    primaryColor: "#704A60",
    accentColor: "#C8A0BA",
    city: "Bogotá",
    services: "Tatuajes personalizados, blackwork, realismo",
  },
  {
    name: "Tattoo DC Studio",
    slug: "tattoo-dc-studio",
    primaryColor: "#76516B",
    accentColor: "#CBA9C2",
    city: "Bogotá",
    services: "Tatuaje personalizado, blackwork, fine line",
  },
  {
    name: "BOGOTA TATTOO",
    slug: "bogota-tattoo",
    primaryColor: "#704D61",
    accentColor: "#C8A6B8",
    city: "Bogotá",
    services: "Tatuajes personalizados, realismo, blackwork",
  },
  {
    name: "HOME TATTOO BOGOTÁ",
    slug: "home-tattoo-bogota",
    primaryColor: "#7C5369",
    accentColor: "#D1A8BE",
    city: "Bogotá",
    services: "Tatuajes personalizados, lettering, blackwork",
  },
  {
    name: "Ulai Pilates Reformer Bulevar",
    slug: "ulai-pilates",
    primaryColor: "#68714F",
    accentColor: "#D0D6B3",
    city: "Bogotá",
    services: "Pilates reformer, entrenamiento personalizado, clases grupales",
  },
  {
    name: "Pulse pilates studio",
    slug: "pulse-pilates-studio",
    primaryColor: "#8A6651",
    accentColor: "#D9C0A4",
    city: "Bogotá",
    services: "Pilates reformer, movilidad, entrenamiento funcional",
  },
  {
    name: "Aima Pilates Studio Bogotá",
    slug: "aima-pilates",
    primaryColor: "#737957",
    accentColor: "#D5D9BA",
    city: "Bogotá",
    services: "Pilates, movilidad, entrenamiento personalizado",
  },
  {
    name: "BiFit Boutique Fitness EMS",
    slug: "bifit-fitness",
    primaryColor: "#735C50",
    accentColor: "#D6B59D",
    city: "Bogotá",
    services: "EMS, entrenamiento personalizado, acondicionamiento físico",
  },
  {
    name: "Fisioterapia Bogotá — Sandra Rincón",
    slug: "fisioterapia-sandra-rincon",
    primaryColor: "#567568",
    accentColor: "#C0D6C8",
    city: "Bogotá",
    services: "Fisioterapia, rehabilitación, terapia física",
  },
  {
    name: "Nutryfit — Diana Rojas",
    slug: "nutryfit-diana-rojas",
    primaryColor: "#788253",
    accentColor: "#D7DBB7",
    city: "Bogotá",
    services: "Nutrición, medicina funcional, seguimiento nutricional",
  },
  {
    name: "Psicólogos Bogotá — Cuerpo, Arte y Palabra",
    slug: "psicologos-bogota",
    primaryColor: "#755B69",
    accentColor: "#D6B7C6",
    city: "Bogotá",
    services: "Psicoterapia individual, terapia de pareja, psicología infantil",
  },
  {
    name: "AZ Máxima Visión — Dra. Carolina Zúñiga",
    slug: "az-maxima-vision",
    primaryColor: "#61796D",
    accentColor: "#C2D6CC",
    city: "Bogotá",
    services: "Optometría, ortóptica, queratocono",
  },
  {
    name: "Clínica Déntica by Cristina Suaza",
    slug: "clinica-dentica",
    primaryColor: "#7C6270",
    accentColor: "#D5BDCA",
    city: "Bogotá",
    services: "Odontología general, estética dental, rehabilitación",
  },
  {
    name: "Unidad Odontofacial",
    slug: "unidad-odontofacial",
    primaryColor: "#80656F",
    accentColor: "#D8BEC9",
    city: "Bogotá",
    services: "Implantes, ortodoncia, diseño de sonrisa",
  },
];

async function main() {
  const created: { name: string; slug: string }[] = [];
  const failed: { name: string; reason: string }[] = [];

  for (const lead of LEADS) {
    try {
      const result = await provisionBusiness(prisma, {
        businessName: lead.name,
        slug: lead.slug,
        primaryColor: lead.primaryColor,
        accentColor: lead.accentColor,
        city: lead.city,
        industryKey: undefined,
        createOwnerUser: false,
        listed: true,
        withSampleBooking: false,
      });

      created.push({
        name: lead.name,
        slug: result.slug,
      });

      console.log(`✓ ${lead.name} → /${result.slug}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failed.push({ name: lead.name, reason });
      console.log(`✗ ${lead.name}: ${reason}`);
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`Created: ${created.length}/${LEADS.length}`);
  console.log(`Failed: ${failed.length}/${LEADS.length}\n`);

  if (created.length > 0) {
    console.log("Created businesses:");
    created.forEach((b) => console.log(`  http://localhost:3000/${b.slug}`));
  }

  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach((f) => console.log(`  ${f.name}: ${f.reason}`));
  }

  console.log(`\nAll businesses are accessible with the platform admin login.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
