import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coffee, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";

interface MenuRow {
  id?: string | number;
  day?: string;
  breakfast?: string;
  lunch?: string;
  dinner?: string;
}

export default function FoodMenu() {
  const navigate = useNavigate();
  const [data, setData] = useState<MenuRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .listMenu()
      .then((d) => alive && setData((d as MenuRow[]) || []))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold text-foreground">Food Menu</h1>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-3">
        {loading && <LoadingState />}
        {!loading && error && <ErrorState error={error} />}
        {!loading && !error && (data?.length ?? 0) === 0 && (
          <EmptyState title="No data available" description="No menu items returned by the server." />
        )}
        {!loading && !error && (data?.length ?? 0) > 0 && data!.map((item, i) => (
          <motion.div
            key={item.id ?? i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-lg p-4 shadow-sm border border-border"
          >
            <h3 className="font-semibold text-foreground mb-3">{item.day || "—"}</h3>
            <div className="space-y-2 text-sm">
              {item.breakfast && (
                <div className="flex items-start gap-2"><Coffee className="h-4 w-4 text-warning mt-0.5 shrink-0" /><div><span className="text-muted-foreground">Breakfast:</span> <span className="text-foreground">{item.breakfast}</span></div></div>
              )}
              {item.lunch && (
                <div className="flex items-start gap-2"><Sun className="h-4 w-4 text-secondary mt-0.5 shrink-0" /><div><span className="text-muted-foreground">Lunch:</span> <span className="text-foreground">{item.lunch}</span></div></div>
              )}
              {item.dinner && (
                <div className="flex items-start gap-2"><Moon className="h-4 w-4 text-primary mt-0.5 shrink-0" /><div><span className="text-muted-foreground">Dinner:</span> <span className="text-foreground">{item.dinner}</span></div></div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
