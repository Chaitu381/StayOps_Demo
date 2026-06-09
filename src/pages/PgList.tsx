import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bed,
  Building2,
  DoorOpen,
  Layers,
  LogOut,
  MapPin,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError, setSelectedPgId } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";

interface PG {
  id: number | string;

  pgName?: string;
  name?: string;
  location?: string;

  totalFloors?: number | string;
  totalFloor?: number | string;
  floors?: number | string;

  roomsPerFloor?: number | string;
  roomPerFloor?: number | string;
  rooms_per_floor?: number | string;

  defaultBedsPerRoom?: number | string;
  bedsPerRoom?: number | string;
  bedPerRoom?: number | string;
  beds_per_room?: number | string;
  default_beds_per_room?: number | string;

  totalRooms?: number | string;
  rooms?: number | string;
  total_rooms?: number | string;

  totalBeds?: number | string;
  beds?: number | string;
  total_beds?: number | string;
}

export default function PgList() {
  const navigate = useNavigate();
  const { creds, logout } = useAuth();

  const [pgs, setPgs] = useState<PG[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [pgApiMissing, setPgApiMissing] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    setPgApiMissing(false);

    try {
      const data = await api.listPgs();
      setPgs(Array.isArray(data) ? (data as PG[]) : []);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
        setPgApiMissing(true);
        setPgs([]);
      } else {
        setError(e);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const stats = useMemo(() => {
    const list = pgs || [];

    return {
      totalPgs: list.length,
      totalFloors: list.reduce((sum, pg) => sum + numberOrZero(getTotalFloors(pg)), 0),
      totalRooms: list.reduce((sum, pg) => sum + numberOrZero(getTotalRooms(pg)), 0),
      totalBeds: list.reduce((sum, pg) => sum + numberOrZero(getTotalBeds(pg)), 0),
    };
  }, [pgs]);

  function numberOrZero(value: unknown) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function toNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === "") return null;

    const num = Number(value);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  function getPgName(pg: PG) {
    return pg.pgName || pg.name || `PG ${pg.id}`;
  }

  function getTotalFloors(pg: PG) {
    return (
      toNumber(pg.totalFloors) ??
      toNumber(pg.totalFloor) ??
      toNumber(pg.floors) ??
      "-"
    );
  }

  function getRoomsPerFloor(pg: PG) {
    return (
      toNumber(pg.roomsPerFloor) ??
      toNumber(pg.roomPerFloor) ??
      toNumber(pg.rooms_per_floor) ??
      null
    );
  }

  function getBedsPerRoom(pg: PG) {
    return (
      toNumber(pg.defaultBedsPerRoom) ??
      toNumber(pg.bedsPerRoom) ??
      toNumber(pg.bedPerRoom) ??
      toNumber(pg.beds_per_room) ??
      toNumber(pg.default_beds_per_room) ??
      null
    );
  }

  function getTotalRooms(pg: PG) {
    const direct =
      toNumber(pg.totalRooms) ??
      toNumber(pg.total_rooms) ??
      toNumber(pg.rooms);

    if (direct) return direct;

    const floors = toNumber(getTotalFloors(pg));
    const roomsPerFloor = getRoomsPerFloor(pg);

    return floors && roomsPerFloor ? floors * roomsPerFloor : "-";
  }

  function getTotalBeds(pg: PG) {
    const direct =
      toNumber(pg.totalBeds) ??
      toNumber(pg.total_beds) ??
      toNumber(pg.beds);

    if (direct) return direct;

    const floors = toNumber(getTotalFloors(pg));
    const roomsPerFloor = getRoomsPerFloor(pg);
    const bedsPerRoom = getBedsPerRoom(pg);

    return floors && roomsPerFloor && bedsPerRoom
      ? floors * roomsPerFloor * bedsPerRoom
      : "-";
  }

  function openPg(pg: PG) {
    setSelectedPgId(pg.id);
    navigate(`/pg/${pg.id}/dashboard`);
  }

  function logoutUser() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 px-4 py-2 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">
              StayOps
            </h1>
            <p className="text-xs font-medium text-slate-500">
              {creds?.role || "OWNER"}
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={logoutUser}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-4">
        <section className="rounded-2xl border bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Owner Dashboard
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                Your PGs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a property to manage rooms, beds, students, workers, and menu.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="PGs" value={stats.totalPgs} icon={<Building2 className="h-5 w-5" />} />
            <StatCard label="Floors" value={stats.totalFloors} icon={<Layers className="h-5 w-5" />} />
            <StatCard label="Rooms" value={stats.totalRooms} icon={<DoorOpen className="h-5 w-5" />} />
            <StatCard label="Beds" value={stats.totalBeds} icon={<Bed className="h-5 w-5" />} />
          </div>
        </section>

        {loading && <LoadingState label="Loading PGs..." />}

        {!loading && error && <ErrorState error={error} />}

        {!loading && pgApiMissing && (
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">
            Backend API not available: GET /pgs.
          </div>
        )}

        {!loading && !error && pgs && pgs.length === 0 && !pgApiMissing && (
          <EmptyState
            title="No PGs found"
            description="No PG is assigned to this owner yet. Create or assign a PG from Super Admin."
          />
        )}

        {!loading && !error && pgs && pgs.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pgs.map((pg) => (
              <Card
                key={pg.id}
                onClick={() => openPg(pg)}
                className="group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105">
                    <Building2 className="h-7 w-7" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-black tracking-tight text-slate-950">
                      {getPgName(pg)}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {pg.location || "Location not added"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniStat icon={<Layers className="h-4 w-4" />} value={getTotalFloors(pg)} label="Floors" />
                  <MiniStat icon={<DoorOpen className="h-4 w-4" />} value={getTotalRooms(pg)} label="Rooms" />
                  <MiniStat icon={<Bed className="h-4 w-4" />} value={getTotalBeds(pg)} label="Beds" />
                </div>

                <div className="mt-5 border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full transition-all duration-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPg(pg);
                    }}
                  >
                    Open PG
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-slate-50 p-4">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 p-3 text-center">
      <div className="mb-1 text-blue-600">{icon}</div>
      <span className="text-lg font-black text-slate-950">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
