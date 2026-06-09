import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, DoorOpen } from "lucide-react";
import { api } from "@/lib/api";
import SearchBar from "@/components/SearchBar";
import { useEffect, useMemo, useState } from "react";

interface Room {
  id: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
}

interface Bed {
  id: number | string;
  status?: string;
  bedStatus?: string;
  occupied?: boolean;
  isOccupied?: boolean;
  studentId?: number | string | null;
  student?: unknown | null;
  roomId?: number | string;
  room_id?: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
  bedCode?: string;
  room?: Room;
}

function isOccupied(bed: Bed) {
  const status = String(bed.status ?? bed.bedStatus ?? "")
    .trim()
    .toUpperCase();

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

function getRoomNoFromBedCode(bedCode: unknown) {
  if (bedCode == null) return null;

  const text = String(bedCode).trim();

  if (!text.includes("-")) return null;

  return text.split("-")[0];
}

function getFloorFromRoomNo(roomNo: unknown) {
  if (roomNo == null) return null;

  const text = String(roomNo).trim();

  if (!text || text === "0" || text === "—") return null;

  return text.charAt(0);
}

function getRoomNo(room?: Room, bed?: Bed) {
  return (
    room?.roomNo ??
    room?.roomNumber ??
    bed?.roomNo ??
    bed?.roomNumber ??
    bed?.room?.roomNo ??
    bed?.room?.roomNumber ??
    getRoomNoFromBedCode(bed?.bedCode) ??
    null
  );
}

function getFloorNo(room?: Room, bed?: Bed) {
  const roomNo = getRoomNo(room, bed);

  return (
    room?.floorNo ??
    bed?.floorNo ??
    bed?.room?.floorNo ??
    getFloorFromRoomNo(roomNo) ??
    null
  );
}

export default function FloorDetail() {
  const { floorId } = useParams();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.listRooms().catch(() => []),
      api.listBeds().catch(() => []),
    ])
      .then(([roomsData, bedsData]) => {
        setRooms(Array.isArray(roomsData) ? (roomsData as Room[]) : []);
        setBeds(Array.isArray(bedsData) ? (bedsData as Bed[]) : []);
      })
      .catch(console.error);
  }, []);

  const roomGroups = useMemo(() => {
    const roomMap = new Map<number | string, Room>();

    rooms.forEach((room) => {
      roomMap.set(room.id, room);

      if (room.roomNo != null) {
        roomMap.set(room.roomNo, room);
      }

      if (room.roomNumber != null) {
        roomMap.set(room.roomNumber, room);
      }
    });

    const map = new Map<
      string,
      {
        id: number | string;
        roomNo: string;
        total: number;
        occupied: number;
        vacant: number;
      }
    >();

    function ensureRoom(roomNo: string, id: number | string = roomNo) {
      if (!map.has(roomNo)) {
        map.set(roomNo, {
          id,
          roomNo,
          total: 0,
          occupied: 0,
          vacant: 0,
        });
      }

      return map.get(roomNo)!;
    }

    for (const room of rooms) {
      const roomNo = getRoomNo(room);
      const currentFloorNo = getFloorNo(room);

      if (roomNo == null || currentFloorNo == null) continue;

      if (String(currentFloorNo) !== String(floorId)) continue;

      ensureRoom(String(roomNo), room.id);
    }

    for (const bed of beds) {
      const possibleRoomId =
        bed.roomId ??
        bed.room_id ??
        bed.room?.id ??
        bed.roomNo ??
        bed.roomNumber ??
        getRoomNoFromBedCode(bed.bedCode);

      const matchedRoom =
        possibleRoomId != null ? roomMap.get(possibleRoomId) : undefined;

      const roomNo = getRoomNo(matchedRoom, bed);
      const currentFloorNo = getFloorNo(matchedRoom, bed);

      if (roomNo == null || currentFloorNo == null) continue;

      if (String(currentFloorNo) !== String(floorId)) continue;

      const group = ensureRoom(String(roomNo), matchedRoom?.id ?? roomNo);

      group.total += 1;

      if (isOccupied(bed)) {
        group.occupied += 1;
      } else {
        group.vacant += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }),
    );
  }, [rooms, beds, floorId]);

  const filteredRooms = roomGroups.filter((room) =>
    room.roomNo.toLowerCase().includes(search.toLowerCase()),
  );

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
          <h1 className="text-lg font-bold text-foreground">
            Floor {floorId}
          </h1>

          <p className="text-xs text-muted-foreground">
            {roomGroups.length} Rooms
          </p>
        </div>
      </header>

      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search room number..."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.roomNo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => navigate(`/room/${room.id}`)}
              className="cursor-pointer rounded-2xl bg-card p-5 shadow-sm border border-border hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
                    <DoorOpen className="h-7 w-7" />
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-foreground leading-none">
                      {room.roomNo}
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                      Room Details
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Beds
                  </p>

                  <p className="text-2xl font-bold text-foreground">
                    {room.total}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-emerald-700">
                      Occupied
                    </span>

                    <span className="font-bold text-emerald-700">
                      {room.occupied}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${room.total ? (room.occupied / room.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-sky-700">
                      Vacant
                    </span>

                    <span className="font-bold text-sky-700">
                      {room.vacant}
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-sky-100 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{
                        width: `${room.total ? (room.vacant / room.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}