import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  CalendarDays,
  BedDouble,
  CreditCard,
  User,
  Hash,
  IdCard,
  Building2,
  IndianRupee,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { api, setSelectedPgId } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";

interface Student {
  id: number | string;

  firstName?: string;
  lastName?: string;
  name?: string;

  phoneNo?: string;
  phone?: string;

  aadharNo?: string;

  joiningDate?: string;
  joinDate?: string;

  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;

  bedId?: number | string;
  bedCode?: string;
  bedNo?: number | string;

  paidUn?: boolean;
  fullyPaid?: boolean;

  monthlyRent?: number;
  paidAmount?: number;
  dueAmount?: number;

  bed?: {
    id?: number | string;
    bedCode?: string;
    bedNo?: number | string;
    status?: string;
    room?: {
      id?: number | string;
      floorNo?: number | string;
      roomNo?: number | string;
      roomRent?: number;
    } | null;
  } | null;
}

function getStudentName(student: Student) {
  return (
    student.name ||
    `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() ||
    `Student ${student.id}`
  );
}

function getRoomNo(student: Student) {
  const bedCode = student.bedCode || student.bed?.bedCode;

  if (student.roomNo) return student.roomNo;
  if (student.roomNumber) return student.roomNumber;
  if (student.bed?.room?.roomNo) return student.bed.room.roomNo;

  if (bedCode && String(bedCode).includes("-")) {
    return String(bedCode).split("-")[0];
  }

  return "-";
}

function getBedNo(student: Student) {
  if (student.bed?.bedNo) return student.bed.bedNo;
  if (student.bedNo) return student.bedNo;

  const bedCode = student.bedCode || student.bed?.bedCode;

  if (bedCode && String(bedCode).includes("-")) {
    return String(bedCode).split("-")[1];
  }

  return student.bedId || "-";
}

function getBedCode(student: Student) {
  return student.bed?.bedCode || student.bedCode || "-";
}

function getFloorNo(student: Student) {
  const roomNo = getRoomNo(student);

  if (student.floorNo) return student.floorNo;
  if (student.bed?.room?.floorNo) return student.bed.room.floorNo;

  if (roomNo !== "-") {
    return String(roomNo).charAt(0);
  }

  return "-";
}

function isStudentPaid(student: Student) {
  if (student.paidUn === true) return true;
  if (student.fullyPaid === true) return true;

  const monthlyRent = Number(student.monthlyRent || 0);
  const paidAmount = Number(student.paidAmount || 0);
  const dueAmount = Number(student.dueAmount || 0);

  return monthlyRent > 0 && paidAmount >= monthlyRent && dueAmount <= 0;
}

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default function StudentDetail() {
  const { studentId, pgId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (pgId) {
      setSelectedPgId(pgId);
    }
  }, [pgId]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const studentsData = await api.listStudents();

        if (!alive) return;

        setStudents(Array.isArray(studentsData) ? (studentsData as Student[]) : []);
      } catch (e) {
        if (alive) {
          setError(e);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [pgId]);

  const student = useMemo(() => {
    return students.find((s) => String(s.id) === String(studentId));
  }, [students, studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState label="Loading student..." />
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

  if (!student) {
    return (
      <div className="min-h-screen bg-background p-6">
        <EmptyState
          title="Student not found"
          description="No student returned from backend for this ID."
        />
      </div>
    );
  }

  const paid = isStudentPaid(student);
  const name = getStudentName(student);

  const info = [
    {
      icon: Hash,
      label: "Student ID",
      value: student.id,
    },
    {
      icon: Phone,
      label: "Phone",
      value: student.phoneNo ?? student.phone ?? "-",
    },
    {
      icon: IdCard,
      label: "Aadhar No",
      value: student.aadharNo ?? "-",
    },
    {
      icon: Building2,
      label: "Floor",
      value: getFloorNo(student),
    },
    {
      icon: BedDouble,
      label: "Room",
      value: getRoomNo(student),
    },
    {
      icon: BedDouble,
      label: "Bed",
      value: getBedNo(student),
    },
    {
      icon: BedDouble,
      label: "Bed Code",
      value: getBedCode(student),
    },
    {
      icon: CalendarDays,
      label: "Join Date",
      value: student.joiningDate ?? student.joinDate ?? "-",
    },
    {
      icon: IndianRupee,
      label: "Monthly Rent",
      value: `₹${formatMoney(student.monthlyRent)}`,
    },
    {
      icon: IndianRupee,
      label: "Paid Amount",
      value: `₹${formatMoney(student.paidAmount)}`,
    },
    {
      icon: IndianRupee,
      label: "Due Amount",
      value: `₹${formatMoney(student.dueAmount)}`,
    },
    {
      icon: CreditCard,
      label: "Rent Status",
      value: paid ? "Paid" : "Unpaid",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-bold text-foreground">Student Profile</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 max-w-2xl mx-auto space-y-4"
      >
        <div className="flex flex-col items-center bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-3 border">
            <User className="h-12 w-12 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-foreground text-center">
            {name}
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Student ID: {student.id}
          </p>

          <Badge
            className={`mt-3 border-0 ${
              paid
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {paid ? "Rent Paid" : "Rent Unpaid"}
          </Badge>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-4">
              <p className="text-sm text-muted-foreground">Room</p>
              <p className="text-xl font-bold text-foreground">
                {getRoomNo(student)}
              </p>
            </div>

            <div className="p-4">
              <p className="text-sm text-muted-foreground">Bed</p>
              <p className="text-xl font-bold text-foreground">
                {getBedCode(student)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {info.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-4 border-b border-border last:border-b-0"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground break-words">
                  {String(value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}