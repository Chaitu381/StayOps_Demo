import { Loader2, AlertCircle } from "lucide-react";
import { ApiError } from "@/lib/api";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  const status = error instanceof ApiError ? error.status : undefined;
  const msg = error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
      <div className="text-sm">
        <p className="font-medium text-destructive">
          {status === 401 || status === 403
            ? `Access denied (${status})`
            : status
              ? `Request failed (${status})`
              : "Error"}
        </p>
        <p className="text-muted-foreground mt-0.5">{msg}</p>
      </div>
    </div>
  );
}
