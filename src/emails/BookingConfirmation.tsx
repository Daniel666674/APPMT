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
      previewText={`Your appointment with ${businessName} is confirmed for ${dateLabel}`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="You're booked!"
    >
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>Hi {customerName}, your appointment is confirmed.</Text>
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Service" value={serviceName} />
        <DetailRow label="With" value={staffName} />
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Time" value={timeLabel} />
      </Section>
      <Button href={manageUrl} style={{ backgroundColor: primaryColor, color: "#ffffff", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
        Manage your appointment
      </Button>
      <Text style={{ fontSize: 12, color: "#a1a1aa", marginTop: 20 }}>
        Need to cancel or reschedule? Use the button above — no account needed.
      </Text>
    </EmailLayout>
  );
}

export default BookingConfirmationEmail;
