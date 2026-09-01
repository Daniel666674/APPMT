import { Section, Text } from "@react-email/components";
import { DetailRow, EmailLayout } from "./components/EmailLayout";

export function BookingCancelledEmail(props: {
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  customerName: string;
  serviceName: string;
  dateLabel: string;
  timeLabel: string;
  bookAgainUrl: string;
}) {
  const { businessName, logoUrl, primaryColor, customerName, serviceName, dateLabel, timeLabel, bookAgainUrl } = props;
  return (
    <EmailLayout
      previewText={`Tu cita en ${businessName} fue cancelada`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="Cita cancelada"
    >
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>Hola {customerName}, esta cita fue cancelada:</Text>
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Servicio" value={serviceName} />
        <DetailRow label="Fecha" value={dateLabel} />
        <DetailRow label="Hora" value={timeLabel} />
      </Section>
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>
        ¿Quieres reagendar? <a href={bookAgainUrl} style={{ color: primaryColor }}>Escoge una nueva hora</a>.
      </Text>
    </EmailLayout>
  );
}

export default BookingCancelledEmail;
