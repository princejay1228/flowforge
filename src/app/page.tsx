import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { APP_NAME } from "@/constants";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">Scaffold / Architecture Phase</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        A universal AI-powered workflow compiler and management platform. This
        repository is currently a foundational scaffold — see{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
          PROJECT_ROADMAP.md
        </code>{" "}
        for the full specification.
      </p>

      <div className="mt-8 flex gap-3">
        <Link href="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
        <Link href="/workspace">
          <Button variant="outline">View Workspaces</Button>
        </Link>
      </div>

      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>
            No application features are implemented yet. This build only
            establishes routing, types, schemas, data layer, and module
            boundaries for future development.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
