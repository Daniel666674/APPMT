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
      previewText={`New booking: ${customerName} — ${serviceName}`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="New appointment booked"
    >
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Service" value={serviceName} />
        <DetailRow label="With" value={staffName} />
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Time" value={timeLabel} />
        <DetailRow label="Customer" value={customerName} />
        <DetailRow label="Email" value={customerEmail} />
        {customerPhone ? <DetailRow label="Phone" value={customerPhone} /> : null}
      </Section>
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>
        <a href={adminUrl} style={{ color: primaryColor }}>View in your dashboard →</a>
      </Text>
    </EmailLayout>
  );
}

export default NewBookingNoticeEmail;
