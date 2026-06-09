import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BedSingle,
  Building2,
  DoorOpen,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError, setSelectedPgId } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

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
  total_rooms?: number | string;
  rooms?: number | string;

  totalBeds?: number | string;
  total_beds?: number | string;
  beds?: number | string;
}

export default function OwnerDetails() {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const { creds } = useAuth();

  const [pgs, setPgs] = useState<PG[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [apiMissing, setApiMissing] = useState(false);

  const canSuperAdminManage = creds?.role === "SUPER_ADMIN";

  async function refresh() {
    if (!ownerId) return;

    setLoading(true);
    setError(null);
    setApiMissing(false);

    try {
      const data = await api.listOwnerPgs(ownerId);
      console.log("OWNER PG RESPONSE:", data);
      setPgs(Array.isArray(data) ? (data as PG[]) : []);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
        setApiMissing(true);
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
  }, [ownerId]);

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

  function open(pg: PG) {
    setSelectedPgId(pg.id);
    navigate(`/pg/${pg.id}/dashboard`);
  }

  async function remove(pg: PG, e: React.MouseEvent) {
    e.stopPropagation();

    if (!confirm(`Delete PG "${getPgName(pg)}"? This cannot be undone.`)) return;

    try {
      await api.deletePg(pg.id);
      toast.success("PG deleted");
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/super-admin/pgs")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-foreground">Owner PGs</h1>
            <p className="text-xs text-muted-foreground">Owner ID: {ownerId}</p>
          </div>
        </div>

        {canSuperAdminManage && (
          <Button
            size="sm"
            onClick={() => navigate(`/owners/${ownerId}/pgs/create`)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Create New PG
          </Button>
        )}
      </header>

      <div className="p-4 max-w-7xl mx-auto space-y-4">
        {loading && <LoadingState label="Loading PGs..." />}

        {!loading && error && <ErrorState error={error} />}

        {!loading && apiMissing && (
          <div className="text-sm rounded-md border border-border bg-card p-3 text-muted-foreground">
            Backend API not available: GET /owners/{ownerId}/pgs.
          </div>
        )}

        {!loading && !error && pgs && pgs.length === 0 && !apiMissing && (
          <EmptyState
            title="No PGs found"
            description="Create a PG inside this owner."
          />
        )}

        {!loading && !error && pgs && pgs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pgs.map((pg) => (
              <Card
                key={pg.id}
                onClick={() => open(pg)}
                className="
                  group
                  p-4
                  cursor-pointer
                  rounded-xl
                  border
                  bg-card
                  transition-all
                  duration-200
                  hover:-translate-y-1
                  hover:shadow-xl
                  hover:border-primary/40
                "
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="
                      h-12
                      w-12
                      rounded-xl
                      bg-primary/10
                      text-primary
                      grid
                      place-items-center
                      shrink-0
                      transition-all
                      duration-200
                      group-hover:bg-primary
                      group-hover:text-white
                      group-hover:scale-105
                    "
                  >
                    <Building2 className="h-6 w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xl font-bold text-foreground leading-tight truncate">
                      {getPgName(pg)}
                    </p>

                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {pg.location || "Location not added"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                  <Stat
                    icon={<Layers className="h-4 w-4 text-primary mb-1" />}
                    value={getTotalFloors(pg)}
                    label="Floors"
                  />

                  <Stat
                    icon={<DoorOpen className="h-4 w-4 text-primary mb-1" />}
                    value={getTotalRooms(pg)}
                    label="Rooms"
                  />

                  <Stat
                    icon={<BedSingle className="h-4 w-4 text-primary mb-1" />}
                    value={getTotalBeds(pg)}
                    label="Beds"
                  />
                </div>

                <div
                  className="flex gap-2 pt-3 border-t border-border"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="
                      flex-1
                      transition-all
                      duration-200
                      group-hover:bg-primary
                      group-hover:text-white
                      group-hover:border-primary
                    "
                    onClick={() => open(pg)}
                  >
                    Open
                  </Button>

                  {canSuperAdminManage && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/super-admin/pgs/${pg.id}/edit`)}
                        className="gap-1"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => remove(pg, e)}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg bg-muted/40 py-2.5 transition-all duration-200 group-hover:bg-primary/5">
      {icon}
      <span className="text-lg font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}