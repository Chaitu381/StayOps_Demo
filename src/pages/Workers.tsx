import { Phone, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";

interface WorkerRow {
  id?: string | number;
  name?: string;
  role?: string;
  phone?: string;
  shift?: string;
}

export default function Workers() {
  const [data, setData] = useState<WorkerRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    api
      .listWorkers()
      .then((d) => {
        if (alive) setData((d as WorkerRow[]) || []);
      })
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-foreground">Workers</h1>

      {loading && <LoadingState />}

      {!loading && error && <ErrorState error={error} />}

      {!loading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="No data available"
          description="No workers returned by the server."
        />
      )}

      {!loading &&
        !error &&
        (data?.length ?? 0) > 0 &&
        data!.map((worker, i) => (
          <motion.div
            key={worker.id ?? i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-lg p-4 shadow-sm border border-border flex items-center gap-4"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {(worker.name || "?")
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">
                {worker.name || "—"}
              </p>

              {worker.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Phone className="h-3 w-3" />
                  {worker.phone}
                </div>
              )}

              {worker.shift && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" />
                  {worker.shift}
                </div>
              )}
            </div>

            {worker.role && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-0 shrink-0"
              >
                {worker.role}
              </Badge>
            )}
          </motion.div>
        ))}
    </div>
  );
}