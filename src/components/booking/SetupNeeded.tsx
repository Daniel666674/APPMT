import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown on a freshly deployed instance whose database has no Business row
 * yet. The deployment is healthy — it just hasn't been configured. This
 * replaces what used to be a hard crash, and doubles as the setup
 * instructions for whoever opens the URL first.
 */
export function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="space-y-5 py-10">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Almost there</p>
            <h1 className="text-2xl font-bold">This scheduler isn&apos;t set up yet</h1>
            <p className="text-sm text-muted-foreground">
              The app deployed successfully and the database is connected — it just needs a business profile
              and an admin login before it can take bookings.
            </p>
          </div>

          <div className="space-y-2 rounded-lg bg-secondary p-4">
            <p className="text-sm font-medium">Run setup once</p>
            <p className="text-sm text-muted-foreground">
              Visit <code className="rounded bg-background px-1.5 py-0.5 text-xs">/api/setup</code> on this
              site with your details filled in:
            </p>
            <pre className="overflow-x-auto rounded-md bg-background p-3 text-xs leading-relaxed">
{`/api/setup
  ?secret=YOUR_SETUP_SECRET
  &email=you@yourbusiness.com
  &password=your-password
  &business=Your Business Name`}
            </pre>
            <p className="text-xs text-muted-foreground">
              <code>secret</code> is the <code>SETUP_SECRET</code> environment variable set on this
              deployment. The link stops working once setup has run.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Already set up? Sign in at{" "}
            <a href="/admin" className="font-medium text-brand hover:underline">
              /admin
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
