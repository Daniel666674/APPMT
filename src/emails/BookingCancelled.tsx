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
      previewText={`Your appointment with ${businessName} has been cancelled`}
      businessName={businessName}
      logoUrl={logoUrl}
      primaryColor={primaryColor}
      title="Appointment cancelled"
    >
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>Hi {customerName}, this appointment has been cancelled:</Text>
      <Section style={{ backgroundColor: "#f4f4f5", borderRadius: 8, padding: "16px 20px", margin: "16px 0" }}>
        <DetailRow label="Service" value={serviceName} />
        <DetailRow label="Date" value={dateLabel} />
        <DetailRow label="Time" value={timeLabel} />
      </Section>
      <Text style={{ fontSize: 14, color: "#3f3f46" }}>
        Want to rebook? <a href={bookAgainUrl} style={{ color: primaryColor }}>Find a new time</a>.
      </Text>
    </EmailLayout>
  );
}

export default BookingCancelledEmail;
