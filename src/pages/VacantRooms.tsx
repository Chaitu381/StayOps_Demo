import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { motion } from "framer-motion";
import { api, setSelectedPgId } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";

interface Room {
  id: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
}

interface BedRow {
  id: number | string;
  roomId?: number | string;
  roomNo?: number | string;
  room?: Room;
  status?: string;
  occupied?: boolean;
  isOccupied?: boolean;
  studentId?: number | string | null;
  student?: unknown | null;
}

function isOccupied(bed: BedRow) {
  return (
    String(bed.status || "").toUpperCase() === "OCCUPIED" ||
    bed.occupied === true ||
    bed.isOccupied === true ||
    bed.studentId != null ||
    bed.student != null
  );
}

function getRoomIdFromBed(bed: BedRow) {
  return bed.roomId ?? bed.room?.id;
}

export default function VacantRooms() {
  const navigate = useNavigate();
  const { pgId } = useParams();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<BedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (pgId) setSelectedPgId(pgId);
  }, [pgId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [roomsData, bedsData] = await Promise.all([
          api.listRooms(),
          api.listBeds(),
        ]);

        if (!alive) return;

        setRooms(Array.isArray(roomsData) ? (roomsData as Room[]) : []);
        setBeds(Array.isArray(bedsData) ? (bedsData as BedRow[]) : []);
      } catch (e) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [pgId]);

  const vacantRooms = useMemo(() => {
    return rooms
      .map((room) => {
        const roomBeds = beds.filter(
          (bed) => String(getRoomIdFromBed(bed)) === String(room.id)
        );

        const vacant = roomBeds.filter((bed) => !isOccupied(bed)).length;

        return {
          room,
          totalBeds: roomBeds.length,
          vacant,
        };
      })
      .filter((item) => item.vacant > 0)
      .sort((a, b) =>
        String(a.room.roomNo ?? a.room.roomNumber ?? a.room.id).localeCompare(
          String(b.room.roomNo ?? b.room.roomNumber ?? b.room.id),
          undefined,
          { numeric: true }
        )
      );
  }, [rooms, beds]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading vacant rooms..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ErrorState error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-foreground">Vacant Rooms</h1>
          <p className="text-xs text-muted-foreground">
            {vacantRooms.length} rooms with vacancies
          </p>
        </div>
      </header>

      <div className="p-4 max-w-3xl mx-auto space-y-3">
        {vacantRooms.length === 0 && (
          <EmptyState
            title="No vacant rooms"
            description="Every backend room is either full or has no beds."
          />
        )}

        {vacantRooms.map(({ room, vacant, totalBeds }, i) => {
          const roomNo = room.roomNo ?? room.roomNumber ?? room.id;

          return (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => navigate(`/room/${room.id}`)}
              className="bg-card rounded-lg p-4 shadow-sm border border-border flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <DoorOpen className="h-5 w-5 text-warning" />

              <div className="flex-1">
                <p className="font-medium text-foreground">Room {roomNo}</p>
                <p className="text-xs text-muted-foreground">
                  Floor {room.floorNo ?? "-"} · {vacant} vacant bed
                  {vacant > 1 ? "s" : ""} of {totalBeds}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}