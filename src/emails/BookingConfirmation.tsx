import { Button, Section, Text } from "@react-email/components";
import { DetailRow, EmailLayout } from "./components/EmailLayout";

export function BookingConfirmationEmail(props: {
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  customerName: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  timeLabel: string;
  manageUrl: string;
}) {
  const { businessName, logoUrl, primaryColor, customerName, serviceName, staffName, dateLabel, timeLabel, manageUrl } = props;
  return (
    <EmailLayout
      previewText={`Tu cita en ${businessName} quedó confirmada para el ${dateLabel}`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="¡Tu cita quedó confirmada!"
    >
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>Hola {customerName}, tu cita está confirmada.</Text>
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Servicio" value={serviceName} />
        <DetailRow label="Con" value={staffName} />
        <DetailRow label="Fecha" value={dateLabel} />
        <DetailRow label="Hora" value={timeLabel} />
      </Section>
      <Button href={manageUrl} style={{ backgroundColor: primaryColor, color: "#ffffff", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
        Gestionar mi cita
      </Button>
      <Text style={{ fontSize: 12, color: "#a1a1aa", marginTop: 20 }}>
        ¿Necesitas cancelar o cambiar la hora? Usa el botón de arriba. No necesitas crear una cuenta.
      </Text>
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;
