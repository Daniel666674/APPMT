import { getBusinessOrNull } from "@/lib/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const business = await getBusinessOrNull();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {business?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.name} className="mx-auto h-10 w-auto object-contain" />
          ) : (
            <CardTitle className="text-brand">{business?.name ?? "Agenda de citas"}</CardTitle>
          )}
          <p className="text-sm text-muted-foreground">Inicia sesión en tu panel</p>
        </CardHeader>
        <CardContent>
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
