import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Users,
  BedSingle,
  CheckCircle2,
  XCircle,
  LogOut,
  ArrowLeft,
  Download,
  FileDown,
  Building2,
  BedDouble,
  Pencil,
  UserRound,
  IndianRupee,
} from "lucide-react";

import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { api, ApiError, setSelectedPgId } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

interface PG {
  id: number | string;
  pgName?: string;
  name?: string;
  location?: string;
  defaultRent?: number;
  roomRent?: number;
  rent?: number;
}

interface Room {
  id: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
}

interface Bed {
  id: number | string;
  occupied?: boolean;
  isOccupied?: boolean;
  studentId?: number | string | null;
  status?: string;
  bedStatus?: string;
  roomId?: number | string;
  room_id?: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
  bedCode?: string;
  bedNo?: number;
  room?: Room | null;
  student?: unknown | null;
}

interface Student {
  id: number | string;
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  aadharNo?: string;
  joiningDate?: string;

  roomNo?: number | string;
  bedCode?: string;
  bedId?: number | string;

  paidUn?: boolean;
  fullyPaid?: boolean;

  monthlyRent?: number;
  paidAmount?: number;
  dueAmount?: number;

  bed?: {
    id?: number | string;
    bedCode?: string;
    bedNo?: number;
    room?: {
      id?: number | string;
      roomNo?: number | string;
      floorNo?: number | string;
      roomRent?: number;
    } | null;
  } | null;
}

interface MonthlyStatus {
  id: number | string;
  studentId?: number | string;
  paid?: boolean;
}

function getStatus(bed: Bed) {
  return String(bed.status ?? bed.bedStatus ?? "").trim().toUpperCase();
}

function isOccupied(bed: Bed) {
  const status = getStatus(bed);

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

function isStudentPaid(student: Student) {
  if (student.paidUn === true) return true;
  if (student.fullyPaid === true) return true;

  const monthlyRent = Number(student.monthlyRent || 0);
  const paidAmount = Number(student.paidAmount || 0);
  const dueAmount = Number(student.dueAmount || 0);

  return monthlyRent > 0 && paidAmount >= monthlyRent && dueAmount <= 0;
}

function money(value: number) {
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function getFloorFromRoomNo(roomNo: unknown) {
  if (roomNo == null) return null;

  const text = String(roomNo).trim();

  if (!text || text === "0" || text === "—") return null;

  const firstDigit = text.charAt(0);

  if (!/^[1-9]$/.test(firstDigit)) return null;

  return firstDigit;
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

function getBedFloorNo(bed: Bed) {
  return (
    bed.floorNo ??
    bed.room?.floorNo ??
    getFloorFromRoomNo(getBedRoomNo(bed))
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { pgId } = useParams();
  const location = useLocation();
  const { creds, logout } = useAuth();

  const [pgName, setPgName] = useState("");
  const [pgData, setPgData] = useState<PG | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [monthly, setMonthly] = useState<MonthlyStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVacantFloor, setSelectedVacantFloor] = useState<string | null>(
    null
  );
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (pgId) setSelectedPgId(pgId);
  }, [pgId]);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [studentsData, bedsData, roomsData, monthlyData, pgResponse] =
          await Promise.all([
            api.listStudents().catch(() => []),
            api.listBeds().catch(() => []),
            api.listRooms().catch(() => []),
            api.listMonthly().catch(() => []),
            pgId ? api.getPgById(pgId) : Promise.resolve(null),
          ]);

        if (!active) return;
        console.log("studentsData:", studentsData);
        console.log("bedsData:", bedsData);
        console.log("pgResponse:", pgResponse);

        setStudents(
          Array.isArray(studentsData) ? (studentsData as Student[]) : []
        );

        setBeds(Array.isArray(bedsData) ? (bedsData as Bed[]) : []);

        setRooms(Array.isArray(roomsData) ? (roomsData as Room[]) : []);

        setMonthly(
          Array.isArray(monthlyData) ? (monthlyData as MonthlyStatus[]) : []
        );

        if (pgResponse && typeof pgResponse === "object") {
          console.log("PG RESPONSE:", pgResponse);

          const pg = pgResponse as PG;
          setPgData(pg);
          setPgName(String(pg.pgName ?? pg.name ?? "PG Manager"));
        } else {
          setPgData(null);
          setPgName("PG Manager");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load dashboard"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [pgId, location.key]);

  const floorGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        floorNo: string;
        rooms: Set<string | number>;
        filled: number;
        vacant: number;
      }
    >();

    function ensureFloor(floorNo: string) {
      if (!map.has(floorNo)) {
        map.set(floorNo, {
          floorNo,
          rooms: new Set(),
          filled: 0,
          vacant: 0,
        });
      }

      return map.get(floorNo)!;
    }

    for (const room of rooms) {
      const roomNo = room.roomNo ?? room.roomNumber ?? room.id;
      const floorNo = room.floorNo ?? getFloorFromRoomNo(roomNo);

      if (floorNo == null) continue;

      const group = ensureFloor(String(floorNo));
      group.rooms.add(roomNo);
    }

    for (const bed of beds) {
      const roomNo = getBedRoomNo(bed);
      const floorNo = getBedFloorNo(bed);

      if (floorNo == null) continue;

      const group = ensureFloor(String(floorNo));

      if (roomNo != null) {
        group.rooms.add(roomNo);
      }

      if (isOccupied(bed)) {
        group.filled += 1;
      } else {
        group.vacant += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      String(a.floorNo).localeCompare(String(b.floorNo), undefined, {
        numeric: true,
      })
    );
  }, [beds, rooms]);

  const stats = useMemo(() => {
    const filledBeds = beds.filter(isOccupied).length;
    const vacantBeds = Math.max(beds.length - filledBeds, 0);

    const paidCount = students.filter(isStudentPaid).length;
    const unpaidCount = students.filter((student) => !isStudentPaid(student)).length;

    return {
      filledBeds,
      vacantBeds,
      paidCount,
      unpaidCount,
      totalBeds: beds.length,
      totalStudents: students.length,
    };
  }, [beds, students]);

  const rentStats = useMemo(() => {
    const pgDefaultRent = Number(
      pgData?.defaultRent ?? pgData?.roomRent ?? pgData?.rent ?? 0
    );

    const expectedAmount = students.reduce((total, student) => {
      const monthlyRent = Number(student.monthlyRent ?? 0);
      const paidAmount = Number(student.paidAmount ?? 0);
      const dueAmount = Number(student.dueAmount ?? 0);

      if (monthlyRent > 0) return total + monthlyRent;
      if (paidAmount + dueAmount > 0) return total + paidAmount + dueAmount;
      if (pgDefaultRent > 0) return total + pgDefaultRent;

      return total;
    }, 0);

    const receivedAmount = students.reduce((total, student) => {
      return total + Number(student.paidAmount ?? 0);
    }, 0);

    const dueAmount = Math.max(expectedAmount - receivedAmount, 0);

    const receivedPct =
      expectedAmount > 0
        ? Math.min(Math.round((receivedAmount / expectedAmount) * 100), 100)
        : 0;

    return {
      expectedAmount,
      receivedAmount,
      dueAmount,
      receivedPct,
    };
  }, [students, pgData]);

  const filledPct = stats.totalBeds
    ? Math.round((stats.filledBeds / stats.totalBeds) * 100)
    : 0;

  const vacantPct = stats.totalBeds
    ? Math.round((stats.vacantBeds / stats.totalBeds) * 100)
    : 0;

  const paidPct = stats.totalStudents
    ? Math.round((stats.paidCount / stats.totalStudents) * 100)
    : 0;

  const unpaidPct = stats.totalStudents
    ? Math.round((stats.unpaidCount / stats.totalStudents) * 100)
    : 0;

  const searchParams = new URLSearchParams(location.search);
  const view = searchParams.get("view");

  const vacantBeds = beds.filter((bed) => !isOccupied(bed));

  const handleDownloadAll = async () => {
    try {
      await api.downloadAllStudents();
      toast.success("All students CSV downloaded");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Download failed");
    }
  };

  const handleDownloadUnpaid = async () => {
    try {
      await api.downloadUnpaidStudents();
      toast.success("Unpaid students CSV downloaded");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Download failed");
    }
  };

  const vacantBedsByFloor = vacantBeds.reduce((acc, bed) => {
    const roomNo = getBedRoomNo(bed);
    const floorNo = getBedFloorNo(bed) ?? "-";

    if (!acc[String(floorNo)]) acc[String(floorNo)] = [];

    acc[String(floorNo)].push({
      ...bed,
      roomNo: roomNo ?? bed.roomNo,
    });

    return acc;
  }, {} as Record<string, Bed[]>);

  const vacantFloors = Object.keys(vacantBedsByFloor).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const activeVacantFloor = selectedVacantFloor ?? vacantFloors[0];

  const floorVacantBeds = activeVacantFloor
    ? vacantBedsByFloor[activeVacantFloor] ?? []
    : [];

  function logoutUser() {
    logout();
    navigate("/login");
  }

  if (view === "vacant-beds") {
    return (
      <div className="min-h-screen bg-background pb-10">
        <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border px-4 py-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigate(pgId ? `/pg/${pgId}/dashboard` : "/dashboard", {
                  replace: true,
                });
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-lg font-bold text-foreground">
                Vacant Beds
              </h1>

              <p className="text-xs text-muted-foreground">
                Available beds across all floors
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setProfileOpen(true)}
            className="rounded-full"
          >
            <UserRound className="h-5 w-5" />
          </Button>
        </header>

        <div className="p-4 sm:p-6 max-w-5xl mx-auto">
          {vacantBeds.length === 0 ? (
            <EmptyState title="No vacant beds available" />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {vacantFloors.map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setSelectedVacantFloor(floor)}
                    className={`rounded-xl border p-4 text-left shadow-sm transition ${
                      activeVacantFloor === floor
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card hover:bg-muted"
                    }`}
                  >
                    <p className="text-lg font-bold">Floor {floor}</p>

                    <p
                      className={`text-sm ${
                        activeVacantFloor === floor
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      }`}
                    >
                      {vacantBedsByFloor[floor].length} vacant beds
                    </p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-4">
                <h2 className="text-xl font-bold mb-4">
                  Floor {activeVacantFloor} Vacant Beds
                </h2>

                {floorVacantBeds.length === 0 ? (
                  <EmptyState title="No vacant beds on this floor" />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {floorVacantBeds.map((bed) => {
                      const roomNo =
                        getBedRoomNo(bed) ??
                        getRoomNoFromBedCode(bed.bedCode) ??
                        "-";

                      const bedNo =
                        bed.bedNo ??
                        (bed.bedCode && String(bed.bedCode).includes("-")
                          ? String(bed.bedCode).split("-")[1]
                          : "-");

                      return (
                        <motion.div
                          key={bed.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border bg-background p-4 shadow-sm flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                              <BedSingle className="h-5 w-5" />
                            </div>

                            <div>
                              <p className="text-lg font-bold">Room {roomNo}</p>
                              <p className="text-sm text-muted-foreground">
                                Bed {bedNo}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                            VACANT
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-10 bg-card/90 backdrop-blur border-b border-border px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          {["SUPER_ADMIN", "OWNER"].includes(creds?.role || "") && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (creds?.role === "SUPER_ADMIN") {
                  navigate(-1);
                } else {
                  navigate("/owner/pgs");
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {pgName || "PG Dashboard"}
            </h1>

            <p className="text-xs text-muted-foreground">
              Manage rooms, beds, rent, food, and workers
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setProfileOpen(true)}
          className="rounded-full"
        >
          <UserRound className="h-5 w-5" />
        </Button>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto"
      >
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm">
            {error}
          </div>
        )}

        <motion.div
          variants={item}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          <StatCard
            icon={Users}
            label="Students"
            value="Add"
            subtext="Add new student"
            variant="primary"
            onClick={() =>
              navigate(pgId ? `/pg/${pgId}/students?action=create` : "/residents")
            }
          />

          <StatCard
            icon={UtensilsCrossed}
            label="Food Menu"
            value="View"
            subtext="Weekly menu & meals"
            variant="secondary"
            onClick={() => navigate(pgId ? `/pg/${pgId}/menu` : "/food-menu")}
          />

          <StatCard
            icon={Users}
            label="Worker List"
            value="View"
            subtext="Staff & shifts"
            variant="primary"
            onClick={() => navigate(pgId ? `/pg/${pgId}/workers` : "/workers")}
          />
        </motion.div>

        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Floors Overview
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : floorGroups.length === 0 ? (
            <EmptyState
              title="No floors found"
              description="No rooms or beds available from backend."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {floorGroups.map((group) => {
                const total = group.filled + group.vacant;
                const occupancy = total
                  ? Math.round((group.filled / total) * 100)
                  : 0;

                return (
                  <motion.div
                    key={group.floorNo}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="cursor-pointer rounded-xl bg-card p-5 shadow-sm border border-border hover:shadow-lg transition-shadow"
                    onClick={() =>
                      navigate(
                        pgId
                          ? `/pg/${pgId}/floor/${group.floorNo}`
                          : `/floor/${group.floorNo}`
                      )
                    }
                  >
                    <div className="flex items-start justify-between mb-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-foreground">
                            Floor {group.floorNo}
                          </h3>

                          <p className="text-xs text-muted-foreground">
                            {group.rooms.size} rooms
                          </p>
                        </div>
                      </div>

                      {creds?.role === "SUPER_ADMIN" && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              pgId
                                ? `/pg/${pgId}/floor/${group.floorNo}/edit`
                                : `/floor/${group.floorNo}/edit`
                            );
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5">
                        <p className="text-[11px] font-medium text-emerald-700">
                          Filled
                        </p>

                        <p className="text-lg font-bold text-emerald-900 flex items-center gap-1">
                          <BedDouble className="h-4 w-4" />
                          {group.filled}
                        </p>
                      </div>

                      <div className="rounded-lg bg-sky-50 border border-sky-100 p-2.5">
                        <p className="text-[11px] font-medium text-sky-700">
                          Vacant
                        </p>

                        <p className="text-lg font-bold text-sky-900 flex items-center gap-1">
                          <BedDouble className="h-4 w-4" />
                          {group.vacant}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium">Occupancy</span>

                        <span className="font-semibold text-foreground">
                          {occupancy}%
                        </span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-sky-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${occupancy}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div variants={item}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Occupancy Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={BedSingle}
              label="Filled Beds"
              value={stats.filledBeds}
              subtext={`${filledPct}% occupied`}
              progress={filledPct}
              variant="filled"
            />

            <StatCard
              icon={BedSingle}
              label="Vacant Beds"
              value={stats.vacantBeds}
              subtext={`${vacantPct}% available`}
              progress={vacantPct}
              variant="vacant"
              onClick={() =>
                navigate(pgId ? `/pg/${pgId}/dashboard?view=vacant-beds` : "/")
              }
            />
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Rent Status
            </h2>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadAll}
                className="gap-1.5"
                disabled={loading}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">All Students</span>
                <span className="sm:hidden">All</span>
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadUnpaid}
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Unpaid Students</span>
                <span className="sm:hidden">Unpaid</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <StatCard
              icon={CheckCircle2}
              label="Paid"
              value={stats.paidCount}
              subtext={`${paidPct}% of residents`}
              progress={paidPct}
              variant="paid"
              onClick={() =>
                navigate(
                  pgId
                    ? `/pg/${pgId}/students?payment=paid`
                    : "/residents?payment=paid"
                )
              }
            />

            <StatCard
              icon={XCircle}
              label="Unpaid"
              value={stats.unpaidCount}
              subtext={`${unpaidPct}% of residents`}
              progress={unpaidPct}
              variant="unpaid"
              onClick={() =>
                navigate(
                  pgId
                    ? `/pg/${pgId}/students?payment=unpaid`
                    : "/residents?payment=unpaid"
                )
              }
            />
          </div>
        </motion.div>
      </motion.div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary grid place-items-center border">
                <Building2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {pgName || "PG Manager"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  {creds?.role || "Role"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Expected Rent
                </span>

                <span className="font-bold">
                  ₹{money(rentStats.expectedAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Received Till Now
                </span>

                <span className="font-bold text-green-600">
                  ₹{money(rentStats.receivedAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Amount</span>

                <span className="font-bold text-red-600">
                  ₹{money(rentStats.dueAmount)}
                </span>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Collection Progress</span>
                  <span>{rentStats.receivedPct}%</span>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rentStats.receivedPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="font-bold">{stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-center">
                <IndianRupee className="h-4 w-4 mx-auto mb-1 text-primary" />
                <p className="font-bold">{rentStats.receivedPct}%</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={logoutUser}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
