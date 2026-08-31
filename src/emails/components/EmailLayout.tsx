import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";

export function EmailLayout(props: {
  previewText: string;
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  title: string;
  children: React.ReactNode;
}) {
  const { previewText, businessName, logoUrl, primaryColor, title, children } = props;
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Helvetica, Arial, sans-serif", margin: 0, padding: "32px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: 12, maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>
          <Section style={{ backgroundColor: primaryColor, padding: "24px 32px" }}>
            {logoUrl ? (
              <Img src={logoUrl} alt={businessName} height={32} style={{ objectFit: "contain" }} />
            ) : (
              <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: 700, margin: 0 }}>{businessName}</Text>
            )}
          </Section>
          <Section style={{ padding: "32px" }}>
            <Heading as="h2" style={{ fontSize: 20, marginTop: 0, marginBottom: 16, color: "#18181b" }}>
              {title}
            </Heading>
            {children}
          </Section>
          <Hr style={{ borderColor: "#e4e4e7", margin: 0 }} />
          <Section style={{ padding: "16px 32px" }}>
            <Text style={{ fontSize: 12, color: "#a1a1aa", margin: 0 }}>{businessName} · Sent via Appointment Scheduler</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function DetailRow(props: { label: string; value: string }) {
  return (
    <Text style={{ fontSize: 14, color: "#3f3f46", margin: "4px 0" }}>
      <strong style={{ color: "#18181b" }}>{props.label}:</strong> {props.value}
    </Text>
  );
}
