import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import { toast } from "sonner";

interface PG {
  id: number | string;
  pgName?: string;
  name?: string;
  location?: string;
  totalFloors?: number;
  roomsPerFloor?: number;
  bedsPerRoom?: number;
}

export default function EditPg() {
  const { pgId } = useParams();
  const navigate = useNavigate();
  const [original, setOriginal] = useState<PG | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<unknown>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = (await api.getPgById(pgId!)) as PG;
        if (!active) return;
        setOriginal(data);
        setForm({
          pgName: String(data.pgName ?? data.name ?? ""),
          location: String(data.location ?? ""),
          totalFloors: String(data.totalFloors ?? ""),
          roomsPerFloor: String(data.roomsPerFloor ?? ""),
          bedsPerRoom: String(data.bedsPerRoom ?? ""),
        });
      } catch (e) {
        if (active) setErr(e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [pgId]);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const structureChanged =
    !!original &&
    (Number(form.totalFloors) !== Number(original.totalFloors ?? 0) ||
      Number(form.roomsPerFloor) !== Number(original.roomsPerFloor ?? 0) ||
      Number(form.bedsPerRoom) !== Number(original.bedsPerRoom ?? 0));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!original) return;
    if (structureChanged) {
      if (!confirm("Changing floors, rooms, or beds will completely rebuild the PG structure. Existing room and bed data may be deleted if no students are assigned. Continue?")) return;
    }
    const changes: Record<string, unknown> = {};
    const cmp = (k: string, current: unknown) => {
      const orig = current == null ? "" : String(current);
      if (form[k] !== orig) {
        if (["totalFloors", "roomsPerFloor", "bedsPerRoom"].includes(k)) {
          changes[k] = Number(form[k]);
        } else {
          changes[k] = form[k];
        }
      }
    };
    cmp("pgName", original.pgName ?? original.name);
    cmp("location", original.location);
    cmp("totalFloors", original.totalFloors);
    cmp("roomsPerFloor", original.roomsPerFloor);
    cmp("bedsPerRoom", original.bedsPerRoom);

    if (Object.keys(changes).length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);
    try {
      await api.updatePg(pgId!, changes);
      toast.success("PG updated");
      navigate(`/pg/${pgId}/dashboard`);
    } 
    catch (e2) {

      if (e2 instanceof ApiError) {

        if (
          e2.message.includes("Cannot modify PG structure")
        ) {

          toast.error(
            "Cannot change floors, rooms, or beds while students are assigned. Remove or move students first."
          );

        } else {

          toast.error(e2.message);
        }

      } else {

        toast.error("Update failed");
      }
    }
    finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Edit PG</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {loading && <LoadingState label="Loading PG..." />}
        {!loading && err && <ErrorState error={err} />}
        {!loading && !err && original && (
          <Card className="p-6">
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="PG Name" v={form.pgName} on={(v) => set("pgName", v)} />
                <Field label="Location" v={form.location} on={(v) => set("location", v)} />
                <Field label="Total Floors" type="number" v={form.totalFloors} on={(v) => set("totalFloors", v)} />
                <Field label="Rooms per Floor" type="number" v={form.roomsPerFloor} on={(v) => set("roomsPerFloor", v)} />
                <Field label="Beds per Room" type="number" v={form.bedsPerRoom} on={(v) => set("bedsPerRoom", v)} />
              </div>
              {structureChanged && (
                <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Changing room structure may affect existing room/bed data.
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

function Field({
  label, v, on, type = "text",
}: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={v ?? ""} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
