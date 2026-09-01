import { Section, Text } from "@react-email/components";
import { DetailRow, EmailLayout } from "./components/EmailLayout";

export function NewBookingNoticeEmail(props: {
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  serviceName: string;
  staffName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  dateLabel: string;
  timeLabel: string;
  adminUrl: string;
}) {
  const {
    businessName,
    logoUrl,
    primaryColor,
    serviceName,
    staffName,
    customerName,
    customerEmail,
    customerPhone,
    dateLabel,
    timeLabel,
    adminUrl,
  } = props;
  return (
    <EmailLayout
      previewText={`Nueva reserva: ${customerName} — ${serviceName}`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="Nueva cita reservada"
    >
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Servicio" value={serviceName} />
        <DetailRow label="Con" value={staffName} />
        <DetailRow label="Fecha" value={dateLabel} />
        <DetailRow label="Hora" value={timeLabel} />
        <DetailRow label="Cliente" value={customerName} />
        <DetailRow label="Correo" value={customerEmail} />
        {customerPhone ? <DetailRow label="Teléfono" value={customerPhone} /> : null}
      </Section>
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>
        <a href={adminUrl} style={{ color: primaryColor }}>Ver en tu panel →</a>
      </Text>
    </EmailLayout>
  );
}

export default NewBookingNoticeEmail;
