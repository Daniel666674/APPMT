import { Button, Section, Text } from "@react-email/components";
import { DetailRow, EmailLayout } from "./components/EmailLayout";

export function BookingReminderEmail(props: {
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
      previewText={`Recordatorio: se acerca tu cita en ${businessName}`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="¡Nos vemos pronto!"
    >
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>Hola {customerName}, te recordamos tu próxima cita.</Text>
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Servicio" value={serviceName} />
        <DetailRow label="Con" value={staffName} />
        <DetailRow label="Fecha" value={dateLabel} />
        <DetailRow label="Hora" value={timeLabel} />
      </Section>
      <Button href={manageUrl} style={{ backgroundColor: primaryColor, color: "#ffffff", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
        Gestionar mi cita
      </Button>
    </EmailLayout>
  );
}

export default BookingReminderEmail;
