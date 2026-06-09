import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface Room {
  id: number;
  roomNo?: number | string;
  floorNo?: number | string;
  beds?: unknown[];
  bedCount?: number;
}

export default function RoomsPage() {
  const { creds } = useAuth();
  const isSuper = creds?.role === "SUPER_ADMIN";
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [floorOpen, setFloorOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [floorForm, setFloorForm] = useState({ floorNo: "", roomsPerFloor: "", bedsPerRoom: "" });
  const [roomForm, setRoomForm] = useState({ floorNo: "", roomNo: "", bedsPerRoom: "" });
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.listRooms();
      setRooms(r as Room[]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function submitFloor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createFloor({
        floorNo: Number(floorForm.floorNo),
        roomsPerFloor: Number(floorForm.roomsPerFloor),
        bedsPerRoom: Number(floorForm.bedsPerRoom),
      });
      toast.success("Floor created");
      setFloorOpen(false);
      setFloorForm({ floorNo: "", roomsPerFloor: "", bedsPerRoom: "" });
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError && (err.status === 404 || err.status === 405)
        ? "Backend endpoint not available"
        : err instanceof ApiError ? err.message : "Failed");
    } finally { setSaving(false); }
  }
  async function submitRoom(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createRoom({
        floorNo: Number(roomForm.floorNo),
        roomNo: roomForm.roomNo,
        bedsPerRoom: Number(roomForm.bedsPerRoom),
      });
      toast.success("Room created");
      setRoomOpen(false);
      setRoomForm({ floorNo: "", roomNo: "", bedsPerRoom: "" });
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError && (err.status === 404 || err.status === 405)
        ? "Backend endpoint not available"
        : err instanceof ApiError ? err.message : "Failed");
    } finally { setSaving(false); }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">Rooms</h1>
          {isSuper && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFloorOpen(true)}><Plus className="h-4 w-4" /> Add Floor</Button>
              <Button onClick={() => setRoomOpen(true)}><Plus className="h-4 w-4" /> Add Room</Button>
            </div>
          )}
        </div>
        <Card>
          {loading && <LoadingState />}
          {!loading && error && <div className="p-4"><ErrorState error={error} /></div>}
          {!loading && !error && (!rooms || rooms.length === 0) && (
            <EmptyState title="No rooms" description="Run room setup or add a room." />
          )}
          {!loading && !error && rooms && rooms.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room No</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Beds</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.roomNo ?? r.id}</TableCell>
                    <TableCell>{r.floorNo ?? "-"}</TableCell>
                    <TableCell>{r.beds?.length ?? r.bedCount ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Dialog open={floorOpen} onOpenChange={setFloorOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Floor</DialogTitle></DialogHeader>
            <form onSubmit={submitFloor} className="space-y-3">
              <Field label="Floor No" type="number" v={floorForm.floorNo} on={(v) => setFloorForm({ ...floorForm, floorNo: v })} />
              <Field label="Rooms per Floor" type="number" v={floorForm.roomsPerFloor} on={(v) => setFloorForm({ ...floorForm, roomsPerFloor: v })} />
              <Field label="Beds per Room" type="number" v={floorForm.bedsPerRoom} on={(v) => setFloorForm({ ...floorForm, bedsPerRoom: v })} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFloorOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={roomOpen} onOpenChange={setRoomOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
            <form onSubmit={submitRoom} className="space-y-3">
              <Field label="Floor No" type="number" v={roomForm.floorNo} on={(v) => setRoomForm({ ...roomForm, floorNo: v })} />
              <Field label="Room No" v={roomForm.roomNo} on={(v) => setRoomForm({ ...roomForm, roomNo: v })} />
              <Field label="Beds per Room" type="number" v={roomForm.bedsPerRoom} on={(v) => setRoomForm({ ...roomForm, bedsPerRoom: v })} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRoomOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function Field({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} required value={v} onChange={(e) => on(e.target.value)} />
    </div>
  );
}
