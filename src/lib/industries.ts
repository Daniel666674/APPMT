/**
 * Ready-made demo content per industry. Picking one at setup time fills a
 * fresh deployment with believable services, staff and branding for that
 * vertical, so a prospect sees their own business rather than placeholder
 * text. Everything here is editable afterwards from /admin.
 */

export interface IndustryService {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  color: string;
}

export interface IndustryPreset {
  key: string;
  label: string;
  defaultBusinessName: string;
  primaryColor: string;
  accentColor: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  staff: { name: string; color: string }[];
  services: IndustryService[];
}

export const INDUSTRIES: IndustryPreset[] = [
  {
    key: "peluqueria",
    label: "Peluquería y salón de belleza",
    defaultBusinessName: "Salón Aurora",
    primaryColor: "#7c3aed",
    accentColor: "#ec4899",
    heroHeadline: "Agenda tu cita en Salón Aurora",
    heroSubheadline: "Escoge el servicio, mira los cupos libres y aparta el tuyo. Sin llamar.",
    aboutText:
      "Somos un equipo pequeño que le pone cuidado a cada detalle. Atendemos sin cita, pero agendando te evitas la fila.",
    staff: [
      { name: "Valentina Ríos", color: "#7c3aed" },
      { name: "Camila Duarte", color: "#ec4899" },
    ],
    services: [
      { name: "Corte de cabello", description: "Corte, lavado y secado.", durationMinutes: 45, price: 45000, color: "#7c3aed" },
      { name: "Tinte completo", description: "Coloración con asesoría personalizada.", durationMinutes: 120, price: 180000, color: "#ec4899" },
      { name: "Peinado para evento", description: "Peinado y acabado para ocasiones especiales.", durationMinutes: 60, price: 90000, color: "#f59e0b" },
      { name: "Manicura", description: "Limado, cutícula y esmaltado.", durationMinutes: 45, price: 40000, color: "#10b981" },
    ],
  },
  {
    key: "barberia",
    label: "Barbería",
    defaultBusinessName: "Barbería El Roble",
    primaryColor: "#1f2937",
    accentColor: "#d97706",
    heroHeadline: "Aparta tu turno en Barbería El Roble",
    heroSubheadline: "Sin filas ni esperas. Escoge tu barbero y la hora que te sirva.",
    aboutText:
      "Cortes clásicos y modernos, con el cuidado de siempre. Aparta tu turno y llega justo a tu hora.",
    staff: [
      { name: "Andrés Molina", color: "#1f2937" },
      { name: "Julián Castro", color: "#d97706" },
    ],
    services: [
      { name: "Corte clásico", description: "Corte a máquina y tijera, con acabado.", durationMinutes: 30, price: 30000, color: "#1f2937" },
      { name: "Corte + barba", description: "Corte completo con perfilado de barba.", durationMinutes: 45, price: 45000, color: "#d97706" },
      { name: "Afeitado con navaja", description: "Afeitado tradicional con toalla caliente.", durationMinutes: 30, price: 35000, color: "#0ea5e9" },
      { name: "Perfilado de barba", description: "Diseño y arreglo de barba.", durationMinutes: 20, price: 22000, color: "#84cc16" },
    ],
  },
  {
    key: "spa",
    label: "Spa y estética",
    defaultBusinessName: "Spa Serena",
    primaryColor: "#0d9488",
    accentColor: "#a3e635",
    heroHeadline: "Tu momento de descanso empieza aquí",
    heroSubheadline: "Agenda tu tratamiento en Spa Serena en menos de un minuto.",
    aboutText:
      "Un espacio tranquilo para que te desconectes un rato. Nuestras terapeutas te acompañan en cada tratamiento.",
    staff: [
      { name: "Daniela Peña", color: "#0d9488" },
      { name: "Mariana Gómez", color: "#a3e635" },
    ],
    services: [
      { name: "Masaje relajante", description: "Masaje de cuerpo completo con aceites esenciales.", durationMinutes: 60, price: 130000, color: "#0d9488" },
      { name: "Limpieza facial profunda", description: "Limpieza, exfoliación e hidratación.", durationMinutes: 75, price: 150000, color: "#a3e635" },
      { name: "Depilación con cera", description: "Zona a elección.", durationMinutes: 30, price: 55000, color: "#f472b6" },
      { name: "Tratamiento corporal", description: "Exfoliación y envoltura reductora.", durationMinutes: 90, price: 190000, color: "#8b5cf6" },
    ],
  },
  {
    key: "dental",
    label: "Clínica dental",
    defaultBusinessName: "Clínica Dental Sonrisa",
    primaryColor: "#0284c7",
    accentColor: "#22d3ee",
    heroHeadline: "Agenda tu cita odontológica en línea",
    heroSubheadline: "Escoge el día y la hora que mejor te queden. Sin llamadas ni esperas en línea.",
    aboutText:
      "Atención odontológica integral, con equipo moderno y trato cercano. Te confirmamos la cita por correo.",
    staff: [
      { name: "Dra. Laura Herrera", color: "#0284c7" },
      { name: "Dr. Felipe Ochoa", color: "#22d3ee" },
    ],
    services: [
      { name: "Consulta de valoración", description: "Revisión inicial y plan de tratamiento.", durationMinutes: 30, price: 60000, color: "#0284c7" },
      { name: "Limpieza dental", description: "Profilaxis y control de placa.", durationMinutes: 45, price: 120000, color: "#22d3ee" },
      { name: "Blanqueamiento", description: "Blanqueamiento en consultorio.", durationMinutes: 60, price: 320000, color: "#facc15" },
      { name: "Control de ortodoncia", description: "Ajuste mensual de brackets.", durationMinutes: 30, price: 80000, color: "#f97316" },
    ],
  },
  {
    key: "medico",
    label: "Consultorio médico",
    defaultBusinessName: "Consultorio Vida Sana",
    primaryColor: "#0f766e",
    accentColor: "#38bdf8",
    heroHeadline: "Pide tu cita médica en línea",
    heroSubheadline: "Escoge el profesional y el horario que prefieras. Te confirmamos al instante.",
    aboutText:
      "Atención médica general y especializada, con horarios amplios y confirmación inmediata.",
    staff: [
      { name: "Dra. Ana Restrepo", color: "#0f766e" },
      { name: "Dr. Camilo Vargas", color: "#38bdf8" },
    ],
    services: [
      { name: "Consulta general", description: "Valoración médica completa.", durationMinutes: 30, price: 90000, color: "#0f766e" },
      { name: "Control", description: "Seguimiento de tratamiento.", durationMinutes: 20, price: 60000, color: "#38bdf8" },
      { name: "Chequeo preventivo", description: "Examen general y orientación.", durationMinutes: 45, price: 140000, color: "#a855f7" },
    ],
  },
  {
    key: "unas",
    label: "Salón de uñas",
    defaultBusinessName: "Nails Studio Bloom",
    primaryColor: "#db2777",
    accentColor: "#fb7185",
    heroHeadline: "Agenda tu cita en Nails Studio Bloom",
    heroSubheadline: "Diseños a tu medida y atención puntual. Escoge tu cupo.",
    aboutText:
      "Nos especializamos en uñas que duran. Material de primera y diseños hechos a tu medida.",
    staff: [
      { name: "Sofía Marín", color: "#db2777" },
      { name: "Isabella Cruz", color: "#fb7185" },
    ],
    services: [
      { name: "Manicura semipermanente", description: "Esmaltado de larga duración.", durationMinutes: 60, price: 55000, color: "#db2777" },
      { name: "Pedicura spa", description: "Pedicura completa con exfoliación.", durationMinutes: 60, price: 60000, color: "#fb7185" },
      { name: "Uñas acrílicas", description: "Aplicación completa con diseño.", durationMinutes: 120, price: 120000, color: "#a855f7" },
      { name: "Retiro y mantenimiento", description: "Retiro seguro y arreglo.", durationMinutes: 45, price: 35000, color: "#f59e0b" },
    ],
  },
  {
    key: "tatuajes",
    label: "Estudio de tatuajes",
    defaultBusinessName: "Estudio Tinta Negra",
    primaryColor: "#18181b",
    accentColor: "#ef4444",
    heroHeadline: "Agenda tu sesión en Tinta Negra",
    heroSubheadline: "Arranca con una asesoría gratis y aparta tu sesión.",
    aboutText:
      "Trabajamos por cita para dedicarle a cada pieza el tiempo que merece. Materiales esterilizados y asesoría antes de cada sesión.",
    staff: [
      { name: "Mateo Salazar", color: "#18181b" },
      { name: "Renata Ortiz", color: "#ef4444" },
    ],
    services: [
      { name: "Asesoría de diseño", description: "Conversamos tu idea y cotizamos.", durationMinutes: 30, price: 0, color: "#18181b" },
      { name: "Sesión pequeña", description: "Piezas de hasta 10 cm.", durationMinutes: 90, price: 250000, color: "#ef4444" },
      { name: "Sesión completa", description: "Piezas grandes o de varias sesiones.", durationMinutes: 240, price: 700000, color: "#8b5cf6" },
      { name: "Perforación", description: "Piercing con material quirúrgico.", durationMinutes: 30, price: 70000, color: "#14b8a6" },
    ],
  },
  {
    key: "fitness",
    label: "Entrenamiento personal",
    defaultBusinessName: "Studio Fuerza",
    primaryColor: "#ea580c",
    accentColor: "#facc15",
    heroHeadline: "Agenda tu sesión de entrenamiento",
    heroSubheadline: "Entrenamiento uno a uno, en el horario que te sirva.",
    aboutText:
      "Planes de entrenamiento diseñados para tu objetivo, con acompañamiento en cada sesión.",
    staff: [
      { name: "Sebastián Lara", color: "#ea580c" },
      { name: "Paula Jiménez", color: "#facc15" },
    ],
    services: [
      { name: "Sesión personalizada", description: "Entrenamiento uno a uno.", durationMinutes: 60, price: 70000, color: "#ea580c" },
      { name: "Valoración física", description: "Medición y plan de trabajo.", durationMinutes: 45, price: 80000, color: "#facc15" },
      { name: "Asesoría nutricional", description: "Plan de alimentación personalizado.", durationMinutes: 45, price: 90000, color: "#22c55e" },
    ],
  },
  {
    key: "veterinaria",
    label: "Veterinaria",
    defaultBusinessName: "Veterinaria Huellas",
    primaryColor: "#16a34a",
    accentColor: "#f97316",
    heroHeadline: "Agenda la cita de tu mascota",
    heroSubheadline: "Consulta, vacunas y peluquería. Agenda en línea y evítale el estrés de la espera.",
    aboutText:
      "Cuidamos a tu mascota como si fuera nuestra. Atendemos con cita para que nadie espere de más.",
    staff: [
      { name: "Dr. Nicolás Rueda", color: "#16a34a" },
      { name: "Dra. Carolina Mesa", color: "#f97316" },
    ],
    services: [
      { name: "Consulta veterinaria", description: "Revisión general de tu mascota.", durationMinutes: 30, price: 70000, color: "#16a34a" },
      { name: "Vacunación", description: "Aplicación de vacuna y registro.", durationMinutes: 20, price: 55000, color: "#f97316" },
      { name: "Baño y peluquería", description: "Baño, corte y limpieza de oídos.", durationMinutes: 90, price: 65000, color: "#0ea5e9" },
    ],
  },
  {
    key: "consultoria",
    label: "Consultoría y servicios profesionales",
    defaultBusinessName: "Consultoría Norte",
    primaryColor: "#1d4ed8",
    accentColor: "#64748b",
    heroHeadline: "Agenda una reunión con nuestro equipo",
    heroSubheadline: "Escoge el tipo de sesión y la hora que te funcione. La primera es de diagnóstico.",
    aboutText:
      "Acompañamos a empresas y personas con asesoría clara y accionable. La primera sesión es de diagnóstico.",
    staff: [
      { name: "Ricardo Peláez", color: "#1d4ed8" },
      { name: "Natalia Bermúdez", color: "#64748b" },
    ],
    services: [
      { name: "Sesión de diagnóstico", description: "Primera reunión para entender tu caso.", durationMinutes: 45, price: 0, color: "#1d4ed8" },
      { name: "Asesoría estratégica", description: "Sesión de trabajo enfocada.", durationMinutes: 60, price: 250000, color: "#64748b" },
      { name: "Revisión de documentos", description: "Análisis y recomendaciones por escrito.", durationMinutes: 60, price: 200000, color: "#0891b2" },
    ],
  },
  {
    key: "estetica",
    label: "Centro de estética y depilación",
    defaultBusinessName: "Estética Bella Piel",
    primaryColor: "#be185d",
    accentColor: "#f9a8d4",
    heroHeadline: "Agenda tu cita en Bella Piel",
    heroSubheadline: "Depilación láser, faciales y corporales. Escoge tu cupo en segundos.",
    aboutText:
      "Equipos certificados y personal capacitado. Te explicamos el procedimiento antes de empezar y te acompañamos en cada sesión.",
    staff: [
      { name: "Juliana Ospina", color: "#be185d" },
      { name: "Tatiana Cardona", color: "#f9a8d4" },
    ],
    services: [
      { name: "Depilación láser (zona pequeña)", description: "Axilas, bozo o bikini.", durationMinutes: 30, price: 70000, color: "#be185d" },
      { name: "Depilación láser (piernas completas)", description: "Sesión completa con gel frío.", durationMinutes: 60, price: 180000, color: "#f9a8d4" },
      { name: "Limpieza facial", description: "Limpieza profunda con extracción e hidratación.", durationMinutes: 60, price: 110000, color: "#a855f7" },
      { name: "Masaje reductor", description: "Sesión de masaje moldeador.", durationMinutes: 45, price: 85000, color: "#22d3ee" },
    ],
  },
  {
    key: "fisioterapia",
    label: "Fisioterapia y rehabilitación",
    defaultBusinessName: "Centro Movimiento",
    primaryColor: "#0e7490",
    accentColor: "#34d399",
    heroHeadline: "Agenda tu sesión de fisioterapia",
    heroSubheadline: "Escoge el horario que te sirva. Atendemos con cita para no hacerte esperar.",
    aboutText:
      "Trabajamos con plan de tratamiento y seguimiento sesión a sesión. Recibimos órdenes médicas y particulares.",
    staff: [
      { name: "Ft. Alejandro Muñoz", color: "#0e7490" },
      { name: "Ft. Diana Torres", color: "#34d399" },
    ],
    services: [
      { name: "Valoración inicial", description: "Evaluación y plan de tratamiento.", durationMinutes: 45, price: 90000, color: "#0e7490" },
      { name: "Sesión de fisioterapia", description: "Terapia manual y ejercicio terapéutico.", durationMinutes: 45, price: 75000, color: "#34d399" },
      { name: "Masaje descontracturante", description: "Enfocado en cuello, espalda y hombros.", durationMinutes: 40, price: 80000, color: "#f59e0b" },
    ],
  },
  {
    key: "psicologia",
    label: "Psicología y terapia",
    defaultBusinessName: "Consultorio Bienestar",
    primaryColor: "#5b21b6",
    accentColor: "#c4b5fd",
    heroHeadline: "Agenda tu consulta psicológica",
    heroSubheadline: "Presencial o virtual. Escoge el horario y recibe la confirmación por correo.",
    aboutText:
      "Un espacio confidencial y sin juicios. La primera sesión sirve para conocernos y definir cómo seguimos.",
    staff: [
      { name: "Psi. Marcela Ríos", color: "#5b21b6" },
      { name: "Psi. Óscar Beltrán", color: "#c4b5fd" },
    ],
    services: [
      { name: "Primera consulta", description: "Sesión inicial de valoración.", durationMinutes: 60, price: 120000, color: "#5b21b6" },
      { name: "Sesión de seguimiento", description: "Terapia individual.", durationMinutes: 50, price: 100000, color: "#c4b5fd" },
      { name: "Terapia de pareja", description: "Sesión para dos personas.", durationMinutes: 75, price: 170000, color: "#f472b6" },
    ],
  },
  {
    key: "autolavado",
    label: "Autolavado y detallado",
    defaultBusinessName: "Autolavado Brillo",
    primaryColor: "#1d4ed8",
    accentColor: "#38bdf8",
    heroHeadline: "Aparta el turno para tu carro",
    heroSubheadline: "Escoge el servicio y la hora. Llega y te recibimos de una.",
    aboutText:
      "Lavado, polichado y detallado con productos que cuidan la pintura. Trabajamos con cita para que no hagas fila.",
    staff: [
      { name: "Wilson Ramírez", color: "#1d4ed8" },
      { name: "Édinson Parra", color: "#38bdf8" },
    ],
    services: [
      { name: "Lavado general", description: "Exterior, llantas e interior básico.", durationMinutes: 45, price: 35000, color: "#1d4ed8" },
      { name: "Lavado premium", description: "Lavado completo con cera y aspirado a fondo.", durationMinutes: 90, price: 75000, color: "#38bdf8" },
      { name: "Polichado", description: "Corrección de pintura y brillo.", durationMinutes: 180, price: 250000, color: "#facc15" },
      { name: "Lavado de motor", description: "Limpieza técnica del motor.", durationMinutes: 45, price: 60000, color: "#22c55e" },
    ],
  },
  {
    key: "clases",
    label: "Clases particulares y academias",
    defaultBusinessName: "Academia Aprende",
    primaryColor: "#c2410c",
    accentColor: "#fbbf24",
    heroHeadline: "Agenda tu clase",
    heroSubheadline: "Escoge el profesor, el tema y la hora. Presencial o virtual.",
    aboutText:
      "Clases uno a uno enfocadas en lo que necesitas reforzar. Primera clase de diagnóstico sin costo.",
    staff: [
      { name: "Prof. Lucía Ardila", color: "#c2410c" },
      { name: "Prof. Iván Guerrero", color: "#fbbf24" },
    ],
    services: [
      { name: "Clase de diagnóstico", description: "Primera clase para ver en qué vas.", durationMinutes: 45, price: 0, color: "#c2410c" },
      { name: "Clase particular", description: "Una hora uno a uno.", durationMinutes: 60, price: 60000, color: "#fbbf24" },
      { name: "Refuerzo para examen", description: "Preparación intensiva.", durationMinutes: 90, price: 90000, color: "#8b5cf6" },
    ],
  },
];

export const DEFAULT_INDUSTRY_KEY = "peluqueria";

export function getIndustry(key: string | undefined | null): IndustryPreset {
  return INDUSTRIES.find((i) => i.key === key) ?? INDUSTRIES.find((i) => i.key === DEFAULT_INDUSTRY_KEY)!;
}
