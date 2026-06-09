import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BedSingle,
  Building2,
  DoorOpen,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError, apiRequest } from "@/lib/api";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

interface Room {
  id: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
  roomRent?: number | null;
}

interface Bed {
  id: number | string;
  bedCode?: string;
  bedNo?: number;
  status?: string;
  bedStatus?: string;
  roomId?: number | string;
  room_id?: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
  room?: {
    id?: number | string;
    roomNo?: number | string;
    roomNumber?: number | string;
    floorNo?: number | string;
  };
  student?: unknown | null;
  studentId?: number | string | null;
  occupied?: boolean;
  isOccupied?: boolean;
}

function getRoomNo(room: Room) {
  return room.roomNo ?? room.roomNumber ?? room.id;
}

function getFloorFromRoom(room: Room) {
  if (room.floorNo != null) return String(room.floorNo);

  const roomNo = getRoomNo(room);
  if (roomNo == null) return "-";

  return String(roomNo).charAt(0);
}

function getRoomNoFromBedCode(bedCode: unknown) {
  if (bedCode == null) return null;

  const text = String(bedCode).trim();

  if (!text.includes("-")) return null;

  return text.split("-")[0];
}

function getBedRoomNo(bed: Bed) {
  return (
    bed.roomNo ??
    bed.roomNumber ??
    bed.room?.roomNo ??
    bed.room?.roomNumber ??
    getRoomNoFromBedCode(bed.bedCode)
  );
}

function getBedStatus(bed: Bed) {
  return String(bed.status ?? bed.bedStatus ?? "").trim().toUpperCase();
}

function isOccupied(bed: Bed) {
  const status = getBedStatus(bed);

  return (
    status === "OCCUPIED" ||
    status === "FILLED" ||
    status === "BOOKED" ||
    status === "ASSIGNED" ||
    bed.occupied === true ||
    bed.isOccupied === true ||
    bed.studentId != null ||
    bed.student != null
  );
}

function bedBelongsToRoom(bed: Bed, room: Room) {
  const roomId = String(room.id);
  const roomNo = String(getRoomNo(room));

  const bedRoomId = bed.roomId ?? bed.room_id ?? bed.room?.id;
  const bedRoomNo = getBedRoomNo(bed);

  return (
    String(bedRoomId) === roomId ||
    String(bedRoomNo) === roomNo
  );
}

export default function FloorEdit() {
  const { pgId, floorNo } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bedCount, setBedCount] = useState("");
  const [roomRent, setRoomRent] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    try {
      const [roomsData, bedsData] = await Promise.all([
        api.listRooms(),
        api.listBeds(),
      ]);

      const allRooms = Array.isArray(roomsData) ? (roomsData as Room[]) : [];
      const allBeds = Array.isArray(bedsData) ? (bedsData as Bed[]) : [];

      console.log("ROOMS DATA:", allRooms);
      console.log("BEDS DATA:", allBeds);

      const floorRooms = allRooms.filter(
        (room) => String(getFloorFromRoom(room)) === String(floorNo)
      );

      setRooms(floorRooms);
      setBeds(allBeds);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load floor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [pgId, floorNo]);

  function getBedsForRoom(room: Room) {
    return beds.filter((bed) => bedBelongsToRoom(bed, room));
  }

  const floorStats = useMemo(() => {
    const floorBeds = rooms.flatMap((room) => getBedsForRoom(room));
    const occupied = floorBeds.filter(isOccupied).length;
    const vacant = Math.max(floorBeds.length - occupied, 0);

    return {
      totalRooms: rooms.length,
      totalBeds: floorBeds.length,
      occupied,
      vacant,
    };
  }, [rooms, beds]);

  function openEditRoom(room: Room) {
    const roomBeds = getBedsForRoom(room);

    setSelectedRoom(room);
    setBedCount(String(roomBeds.length));
    setRoomRent(room.roomRent != null ? String(room.roomRent) : "");
    setEditOpen(true);
  }

  async function saveRoomEdit() {
    if (!pgId || !selectedRoom) {
      toast.error("Missing PG or room data");
      return;
    }

    const roomBeds = getBedsForRoom(selectedRoom);
    const occupiedCount = roomBeds.filter(isOccupied).length;
    const bedCountNumber = Number(bedCount);

    if (!Number.isFinite(bedCountNumber) || bedCountNumber < 1) {
      toast.error("Bed count must be at least 1");
      return;
    }

    if (bedCountNumber < occupiedCount) {
      toast.error(`Cannot reduce below ${occupiedCount}. Students are already assigned.`);
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/pgs/${pgId}/rooms/${selectedRoom.id}/bed-count`, {
        method: "PATCH",
        body: {
            bedCount: bedCountNumber,
        },
        });

        if (roomRent !== "") {
            await apiRequest(
                `/pgs/${pgId}/rooms/${selectedRoom.id}/rent?amount=${Number(roomRent)}`,
                {
                method: "PATCH",
                }
            );
            }

      toast.success("Room updated successfully");
      setEditOpen(false);
      setSelectedRoom(null);
      await loadData();
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : "Room update failed. Backend PATCH endpoint may be missing."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading floor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(pgId ? `/pg/${pgId}/dashboard` : "/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div>
          <h1 className="text-lg font-bold text-foreground">
            Edit Floor {floorNo}
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage rooms and beds inside this floor
          </p>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Card className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Floor</p>
              <p className="text-xl font-bold">{floorNo}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <DoorOpen className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Rooms</p>
              <p className="text-xl font-bold">{floorStats.totalRooms}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BedSingle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Occupied</p>
              <p className="text-xl font-bold">{floorStats.occupied}</p>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <BedSingle className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Vacant</p>
              <p className="text-xl font-bold">{floorStats.vacant}</p>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Rooms in Floor {floorNo}</h2>
            <p className="text-sm text-muted-foreground">
              Edit bed count directly in a popup.
            </p>
          </div>

          {rooms.length === 0 ? (
            <EmptyState title="No rooms found on this floor" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((room) => {
                const roomBeds = getBedsForRoom(room);
                const occupied = roomBeds.filter(isOccupied).length;
                const vacant = Math.max(roomBeds.length - occupied, 0);
                const roomNo = getRoomNo(room);

                return (
                  <div
                    key={room.id}
                    className="rounded-xl border bg-background p-4 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <DoorOpen className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="font-bold text-lg">Room {roomNo}</h3>
                          <p className="text-xs text-muted-foreground">
                            Room ID: {room.id}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => openEditRoom(room)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-lg bg-muted p-2">
                        <p className="text-[11px] text-muted-foreground">Beds</p>
                        <p className="font-bold">{roomBeds.length}</p>
                      </div>

                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2">
                        <p className="text-[11px] text-emerald-700">Filled</p>
                        <p className="font-bold text-emerald-900">{occupied}</p>
                      </div>

                      <div className="rounded-lg bg-sky-50 border border-sky-100 p-2">
                        <p className="text-[11px] text-sky-700">Vacant</p>
                        <p className="font-bold text-sky-900">{vacant}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </main>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Room {selectedRoom ? getRoomNo(selectedRoom) : ""}
            </DialogTitle>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Room Number</Label>
                <Input value={String(getRoomNo(selectedRoom))} disabled />
              </div>

              <div className="space-y-1.5">
                <Label>Total Beds</Label>
                <Input
                  type="number"
                  min="1"
                  value={bedCount}
                  onChange={(e) => setBedCount(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Room Rent</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={roomRent}
                  onChange={(e) => setRoomRent(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button onClick={saveRoomEdit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
