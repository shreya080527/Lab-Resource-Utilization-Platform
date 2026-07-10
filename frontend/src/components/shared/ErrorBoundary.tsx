import * as React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Top-level error boundary — catches unexpected render errors in any route
// and shows a friendly retry panel instead of a blank white screen.
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">
                Something went wrong
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                An unexpected error occurred while rendering this page.
              </p>
              {this.state.error?.message && (
                <p className="mt-2 break-words rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              onClick={() => {
                this.handleRetry();
                window.location.reload();
              }}
              className="gap-1.5 rounded-xl"
            >
              <RotateCw className="size-4" />
              Reload page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
