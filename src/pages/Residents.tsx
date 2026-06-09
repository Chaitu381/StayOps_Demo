import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import SearchBar from "@/components/SearchBar";
import { api } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { mapStudent } from "@/lib/mappers";

interface StudentRow {
  id?: string | number;
  name?: string;
  phone?: string;
  roomNumber?: string;
  rentStatus?: "paid" | "unpaid" | string;
}

export default function Residents() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const filterParam = params.get("filter") as "paid" | "unpaid" | null;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">(filterParam || "all");

  const [data, setData] = useState<StudentRow[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    setLoading(true);
    setError(null);

    api
      .listStudents()
      .then((d) => {
        if (!alive) return;
        setData((d as any[]).map(mapStudent));
      })
      .catch((e) => {
        if (!alive) return;
        setError(e);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const students = (data || [])
    .filter((s) => filter === "all" || s.rentStatus === filter)
    .filter(
      (s) =>
        (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.roomNumber || "").includes(search),
    );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-lg font-bold text-foreground">Residents</h1>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or room..." />

        <div className="flex gap-2">
          {(["all", "paid", "unpaid"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading && <LoadingState />}
        {!loading && error && <ErrorState error={error} />}
        {!loading && !error && students.length === 0 && (
          <EmptyState title="No data available" description="No residents returned by the server." />
        )}

        <div className="space-y-2">
          {!loading && !error && students.map((s, i) => (
            <motion.div
              key={s.id ?? i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => s.id != null && navigate(`/student/${s.id}`)}
              className="bg-card rounded-lg p-4 shadow-sm border border-border flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                {(s.name || "?").split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{s.name || "—"}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {s.roomNumber && <span>Room {s.roomNumber}</span>}
                  {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                </div>
              </div>
              {s.rentStatus && (
                <Badge className={`shrink-0 ${s.rentStatus === "paid" ? "bg-secondary/10 text-secondary border-0" : "bg-warning/10 text-warning border-0"}`}>
                  {s.rentStatus === "paid" ? "Paid" : "Unpaid"}
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
