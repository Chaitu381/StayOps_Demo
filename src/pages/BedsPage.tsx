import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Bed {
  id: number;
  bedCode?: string;
  bedNo?: number;
  status?: string;
  roomNo?: number | string;
  occupied?: boolean;
  room?: {
    roomNo?: number | string;
    floorNo?: number | string;
  } | null;
}

export default function BedsPage({ availableOnly = false }: { availableOnly?: boolean }) {
  const { creds } = useAuth();
  const isSuper = creds?.role === "SUPER_ADMIN";
  const [beds, setBeds] = useState<Bed[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "OCCUPIED">("ALL");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ roomId: "", bedNo: "", bedCode: "" });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = availableOnly ? await api.availableBeds() : await api.listBeds();
      setBeds(data as Bed[]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [availableOnly]);

  async function submitBed(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createBed({
        roomId: Number(form.roomId),
        bedNo: Number(form.bedNo),
        bedCode: form.bedCode,
      });
      toast.success("Bed created");
      setOpen(false);
      setForm({ roomId: "", bedNo: "", bedCode: "" });
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError && (err.status === 404 || err.status === 405)
        ? "Backend endpoint not available"
        : err instanceof ApiError ? err.message : "Failed");
    } finally { setSaving(false); }
  }

  const shown = useMemo(() => {
    if (!beds) return [];
    if (availableOnly || filter === "ALL") return beds;
    return beds.filter((b) => {
      const status = (b.status || (b.occupied ? "OCCUPIED" : "AVAILABLE")).toUpperCase();
      return status === filter;
    });
  }, [beds, filter, availableOnly]);

  function getRoomNo(bed: Bed) {
    if (bed.roomNo) return bed.roomNo;
    if (bed.room?.roomNo) return bed.room.roomNo;

    if (bed.bedCode && bed.bedCode.includes("-")) {
      return bed.bedCode.split("-")[0];
    }

    return "-";
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{availableOnly ? "Available Beds" : "Beds"}</h1>
          <div className="flex items-center gap-2">
            {!availableOnly && isSuper && (
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add Bed</Button>
            )}
            {!availableOnly && (
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <Card>
          {loading && <LoadingState />}
          {!loading && error && <div className="p-4"><ErrorState error={error} /></div>}
          {!loading && !error && shown.length === 0 && <EmptyState title="No beds" />}
          {!loading && !error && shown.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bed Code</TableHead>
                  <TableHead>Bed No</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((b) => {
                  const status = (b.status || (b.occupied ? "OCCUPIED" : "AVAILABLE")).toUpperCase();
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.bedCode || b.id}</TableCell>
                      <TableCell>{b.bedNo ?? "-"}</TableCell>
                      <TableCell>{getRoomNo(b)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            status === "AVAILABLE"
                              ? "text-xs font-medium px-2 py-0.5 rounded bg-green-100 text-green-700"
                              : "text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700"
                          }
                        >
                          {status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Bed</DialogTitle></DialogHeader>
            <form onSubmit={submitBed} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Room ID</Label>
                <Input type="number" required value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bed No</Label>
                <Input type="number" required value={form.bedNo} onChange={(e) => setForm({ ...form, bedNo: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Bed Code</Label>
                <Input required value={form.bedCode} onChange={(e) => setForm({ ...form, bedCode: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
