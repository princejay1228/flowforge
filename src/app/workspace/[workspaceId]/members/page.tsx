export default async function WorkspaceWorkspaceIdMembersPage(props: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await props.params;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder for team member management within a workspace.
      </p>
      <p className="mt-6 rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
        Not implemented yet — this is a routing placeholder created during the
        scaffold phase. See PROJECT_ROADMAP.md.
      </p>
      <dl className="mt-6 space-y-1 text-xs text-muted-foreground">
        {Object.entries({ workspaceId }).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <dt className="font-mono">{key}:</dt>
            <dd className="font-mono">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
