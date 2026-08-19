"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** If true, prevents the backdrop click from closing the dialog */
  disableBackdropClose?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  disableBackdropClose = false,
}: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Prevent background scroll when dialog is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0 p-0 sm:p-4"
      onClick={() => !disableBackdropClose && onOpenChange(false)}
    >
      <div
        className={cn(
          "relative w-full sm:max-w-lg rounded-t-xl sm:rounded-xl border bg-background shadow-2xl transition-all animate-in slide-in-from-bottom sm:zoom-in-95 flex flex-col",
          // Responsive height: almost full screen on mobile, max 90vh on desktop
          "max-h-[92dvh] sm:max-h-[88vh]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="flex-shrink-0 flex flex-col space-y-1.5 px-6 pt-5 pb-3 border-b">
          <div className="pr-8">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Scrollable content body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Sticky footer for dialogs — use this to wrap your action buttons so they
 * are always visible at the bottom of the dialog, even on small screens.
 */
export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex-shrink-0 flex justify-end gap-2 px-6 py-4 border-t bg-background rounded-b-xl", className)}>
      {children}
    </div>
  );
}

