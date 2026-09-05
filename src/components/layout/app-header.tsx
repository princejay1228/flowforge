"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, Users, FolderGit2, Settings, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/constants";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface AppHeaderProps {
  workspaceId?: string;
  workspaceName?: string;
}

export function AppHeader({ workspaceId, workspaceName }: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <Layers className="h-5 w-5" />
            <span>{APP_NAME}</span>
          </Link>

          {workspaceId && workspaceName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border-l pl-4">
              <Link href="/workspace" className="hover:underline">
                Workspaces
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">{workspaceName}</span>
            </div>
          )}
        </div>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {user && (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              <Link
                href="/workspace"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === "/workspace" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <FolderGit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Workspaces</span>
              </Link>

              {workspaceId && (
                <>
                  <Link
                    href={`/workspace/${workspaceId}/projects`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname.includes("/projects") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    <FolderGit2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Projects</span>
                  </Link>

                  <Link
                    href={`/workspace/${workspaceId}/members`}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                      pathname.includes("/members") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Members</span>
                  </Link>
                </>
              )}
            </>
          )}

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              pathname === "/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 w-8 px-0" title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
