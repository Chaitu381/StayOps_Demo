import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import {
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Search,
  Phone,
  Bed,
  CalendarDays,
  IdCard,
  Building2,
  ArrowLeft,
  IndianRupee,
  DoorOpen,
  CheckCircle2,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  aadharNo?: string;
  joiningDate?: string;
  imageUrl?: string;

  paidUn?: boolean;
  fullyPaid?: boolean;
  monthlyRent?: number;
  paidAmount?: number;
  dueAmount?: number;

  bedId?: number;
  bedCode?: string;
  roomNo?: number | string;
  floorNo?: number | string;

  bed?: {
    id?: number;
    bedNo?: number;
    bedCode?: string;
    room?: {
      roomNo?: number | string;
      floorNo?: number | string;
    } | null;
  } | null;
}

interface BedType {
  id: number;
  bedCode?: string;
  bedNo?: number;
  roomNo?: number | string;
  floorNo?: number | string;
  room?: {
    roomNo?: number | string;
    floorNo?: number | string;
  } | null;
}

interface StudentForm {
  firstName: string;
  lastName: string;
  phoneNo: string;
  aadharNo: string;
  joiningDate: string;
  bedId: string;
}

const emptyForm: StudentForm = {
  firstName: "",
  lastName: "",
  phoneNo: "",
  aadharNo: "",
  joiningDate: "",
  bedId: "",
};

export default function StudentPage() {
  const navigate = useNavigate();
  const { pgId } = useParams();
  const [searchParams] = useSearchParams();

  const [students, setStudents] = useState<Student[] | null>(null);
  const [beds, setBeds] = useState<BedType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "profile" | "edit">("create");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [bedSearch, setBedSearch] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);

  const initialPayment =
    searchParams.get("payment") === "paid"
      ? "paid"
      : searchParams.get("payment") === "unpaid"
      ? "unpaid"
      : "all";

  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "paid" | "unpaid"
  >(initialPayment);

  function getRoomNo(student: Student) {
    const bedCode = student.bedCode || student.bed?.bedCode;

    if (student.roomNo) return student.roomNo;
    if (student.bed?.room?.roomNo) return student.bed.room.roomNo;

    if (bedCode && bedCode.includes("-")) {
      return bedCode.split("-")[0];
    }

    return "-";
  }

  function getBedNo(student: Student) {
    if (student.bed?.bedNo) return student.bed.bedNo;

    const bedCode = student.bedCode || student.bed?.bedCode;

    if (bedCode && bedCode.includes("-")) {
      return bedCode.split("-")[1];
    }

    return student.bedId || "-";
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

  function getAvailableBedRoomNo(bed: BedType) {
    if (bed.roomNo) return bed.roomNo;
    if (bed.room?.roomNo) return bed.room.roomNo;

    if (bed.bedCode && bed.bedCode.includes("-")) {
      return bed.bedCode.split("-")[0];
    }

    return "-";
  }

  function getAvailableBedNo(bed: BedType) {
    if (bed.bedNo) return bed.bedNo;

    if (bed.bedCode && bed.bedCode.includes("-")) {
      return bed.bedCode.split("-")[1];
    }

    return "-";
  }

  function getAvailableBedFloorNo(bed: BedType) {
    if (bed.floorNo) return bed.floorNo;
    if (bed.room?.floorNo) return bed.room.floorNo;

    const roomNo = getAvailableBedRoomNo(bed);

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

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const [studentData, bedData] = await Promise.all([
        api.listStudents(),
        api.availableBeds().catch(() => []),
      ]);

      setStudents((studentData as Student[]) || []);
      setBeds((bedData as BedType[]) || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [pgId]);

  function openCreate() {
    setMode("create");
    setSelectedStudent(null);
    setForm(emptyForm);
    setBedSearch("");
    setOpen(true);
  }

  function openProfile(student: Student) {
    setMode("profile");
    setSelectedStudent(student);
    setOpen(true);
  }

  function startEdit() {
    if (!selectedStudent) return;

    setMode("edit");
    setForm({
      firstName: selectedStudent.firstName || "",
      lastName: selectedStudent.lastName || "",
      phoneNo: selectedStudent.phoneNo || "",
      aadharNo: selectedStudent.aadharNo || "",
      joiningDate: selectedStudent.joiningDate || "",
      bedId: selectedStudent.bedId
        ? String(selectedStudent.bedId)
        : selectedStudent.bed?.id
        ? String(selectedStudent.bed.id)
        : "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (mode === "edit" && selectedStudent) {
        const body: Record<string, unknown> = {};

        if (form.firstName !== (selectedStudent.firstName || "")) {
          body.firstName = form.firstName;
        }

        if (form.lastName !== (selectedStudent.lastName || "")) {
          body.lastName = form.lastName;
        }

        if (form.phoneNo !== (selectedStudent.phoneNo || "")) {
          body.phoneNo = form.phoneNo;
        }

        if (form.aadharNo !== (selectedStudent.aadharNo || "")) {
          body.aadharNo = form.aadharNo;
        }

        if (form.joiningDate !== (selectedStudent.joiningDate || "")) {
          body.joiningDate = form.joiningDate;
        }

        if (Object.keys(body).length === 0) {
          toast.info("No changes to save");
          setSaving(false);
          return;
        }

        await api.updateStudent(selectedStudent.id, body);
        toast.success("Student updated");
      } else {
        if (!form.bedId) {
          toast.error("Please assign a bed");
          setSaving(false);
          return;
        }

        await api.createStudent({
          firstName: form.firstName,
          lastName: form.lastName,
          phoneNo: form.phoneNo,
          aadharNo: form.aadharNo,
          joiningDate: form.joiningDate,
          bedId: Number(form.bedId),
        });

        toast.success("Student added");
      }

      setOpen(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(student: Student) {
    const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();

    if (!confirm(`Delete ${fullName || "this student"}?`)) return;

    try {
      await api.deleteStudent(student.id);
      toast.success("Student deleted");
      setOpen(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  const filtered = useMemo(() => {
    if (!students) return [];

    const q = search.trim().toLowerCase();

    return students.filter((s) => {
      const matchesSearch =
        !q ||
        `${s.firstName ?? ""} ${s.lastName ?? ""} ${s.phoneNo ?? ""} ${
          s.aadharNo ?? ""
        } ${getRoomNo(s)} ${getBedNo(s)} ${getFloorNo(s)}`
          .toLowerCase()
          .includes(q);

      const isPaid = isStudentPaid(s);

      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "paid" && isPaid) ||
        (paymentFilter === "unpaid" && !isPaid);

      return matchesSearch && matchesPayment;
    });
  }, [students, search, paymentFilter]);

  const filteredBeds = useMemo(() => {
    const q = bedSearch.trim().toLowerCase();

    if (!q) return beds;

    return beds.filter((bed) => {
      const roomNo = String(getAvailableBedRoomNo(bed)).toLowerCase();
      const bedNo = String(getAvailableBedNo(bed)).toLowerCase();
      const floorNo = String(getAvailableBedFloorNo(bed)).toLowerCase();

      return (
        roomNo.includes(q) ||
        bedNo.includes(q) ||
        floorNo.includes(q) ||
        `room ${roomNo}`.includes(q) ||
        `bed ${bedNo}`.includes(q) ||
        `floor ${floorNo}`.includes(q)
      );
    });
  }, [beds, bedSearch]);

  const selectedBed = useMemo(() => {
    return beds.find((bed) => String(bed.id) === String(form.bedId));
  }, [beds, form.bedId]);

  function openPaymentDialog(student: Student, e?: React.MouseEvent) {
    e?.stopPropagation();

    if (isStudentPaid(student)) {
      toast.info("This student has no due amount");
      return;
    }

    setPaymentStudent(student);
    setPaymentAmount("");
    setPaymentOpen(true);
  }

  async function togglePayment(student: Student, e?: React.MouseEvent) {
    e?.stopPropagation();

    const newPaidStatus = !student.paidUn;

    try {
      await api.toggleStudentPayment(student.id);

      setStudents((prev) =>
        prev
          ? prev.map((s) =>
              s.id === student.id
                ? {
                    ...s,
                    paidUn: newPaidStatus,
                  }
                : s
            )
          : prev
      );

      if (selectedStudent?.id === student.id) {
        setSelectedStudent({
          ...selectedStudent,
          paidUn: newPaidStatus,
        });
      }

      toast.success("Payment status updated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Payment update failed");
    }
  }

  async function savePaymentAmount() {
    if (!paymentStudent) return;

    const amountPaidNow = Number(paymentAmount);
    const currentDue = Number(paymentStudent.dueAmount || 0);

    if (!paymentAmount || Number.isNaN(amountPaidNow) || amountPaidNow <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    if (amountPaidNow > currentDue) {
      toast.error(`Amount cannot be more than due ₹${formatMoney(currentDue)}`);
      return;
    }

    const newDueAmount = currentDue - amountPaidNow;

    setPaymentSaving(true);

    try {
      const updatedStudent = await api.updateDueAmount(
        paymentStudent.id,
        newDueAmount
      );

      toast.success("Payment updated");

      setPaymentOpen(false);
      setPaymentStudent(null);
      setPaymentAmount("");

      setStudents((prev) =>
        prev
          ? prev.map((student) =>
              student.id === paymentStudent.id
                ? {
                    ...student,
                    ...(updatedStudent as Student),
                  }
                : student
            )
          : prev
      );

      if (selectedStudent?.id === paymentStudent.id) {
        setSelectedStudent({
          ...selectedStudent,
          ...(updatedStudent as Student),
        });
      }

      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Payment update failed");
    } finally {
      setPaymentSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button
          onClick={() => navigate(`/pg/${pgId}/dashboard`)}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-bold text-foreground">Students</h1>
      </header>

      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Students</h1>
            <p className="text-sm text-muted-foreground">
              Manage residents and bed assignments.
            </p>
          </div>

          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>

        <Card className="p-4 mb-4 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, aadhar, room, or bed"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={paymentFilter === "all" ? "default" : "outline"}
              onClick={() => setPaymentFilter("all")}
            >
              All
            </Button>

            <Button
              size="sm"
              variant={paymentFilter === "paid" ? "default" : "outline"}
              onClick={() => setPaymentFilter("paid")}
              className={
                paymentFilter === "paid"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : ""
              }
            >
              Paid
            </Button>

            <Button
              size="sm"
              variant={paymentFilter === "unpaid" ? "default" : "outline"}
              onClick={() => setPaymentFilter("unpaid")}
              className={
                paymentFilter === "unpaid"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : ""
              }
            >
              Unpaid
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden border shadow-sm">
          {loading && <LoadingState label="Loading students..." />}

          {!loading && error && (
            <div className="p-4">
              <ErrorState error={error} />
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <EmptyState
              title="No students"
              description="Add your first student to get started."
            />
          )}

          {!loading && !error && filtered.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone No</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((student) => {
                  const initials =
                    `${student.firstName?.[0] || ""}${
                      student.lastName?.[0] || ""
                    }`.toUpperCase() || "ST";

                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer hover:bg-muted/60 transition-colors"
                      onClick={() => openProfile(student)}
                    >
                      <TableCell>
                        <div className="w-12 h-12 rounded-full border bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
                          {initials}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>

                      <TableCell>{student.phoneNo || "-"}</TableCell>

                      <TableCell>{getRoomNo(student)}</TableCell>

                      <TableCell>{getBedNo(student)}</TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => openPaymentDialog(student, e)}
                          className={
                            Number(student.dueAmount || 0) > 0
                              ? "font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                              : "font-semibold text-green-600 hover:text-green-700 hover:bg-green-50"
                          }
                        >
                          ₹{formatMoney(student.dueAmount)}
                        </Button>
                      </TableCell>

                      <TableCell>
                        <Button
                          size="sm"
                          onClick={(e) => togglePayment(student, e)}
                          className={
                            isStudentPaid(student)
                              ? "bg-green-100 text-green-700 hover:bg-green-200 border-0"
                              : "bg-red-100 text-red-700 hover:bg-red-200 border-0"
                          }
                        >
                          {isStudentPaid(student) ? "Paid" : "Unpaid"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {mode === "create"
                  ? "Add Student"
                  : mode === "edit"
                  ? "Edit Student"
                  : "Student Profile"}
              </DialogTitle>
            </DialogHeader>

            {mode === "profile" && selectedStudent && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                      {`${selectedStudent.firstName?.[0] || ""}${
                        selectedStudent.lastName?.[0] || ""
                      }`.toUpperCase() || "ST"}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        Student ID: {selectedStudent.id}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={(e) => openPaymentDialog(selectedStudent, e)}
                    className={
                      isStudentPaid(selectedStudent)
                        ? "bg-green-100 text-green-700 hover:bg-green-200 border-0 px-5"
                        : "bg-red-100 text-red-700 hover:bg-red-200 border-0 px-5"
                    }
                  >
                    {isStudentPaid(selectedStudent) ? "Paid" : "Unpaid"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-0 border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-r">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold">
                        {selectedStudent.phoneNo || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b">
                    <IdCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Aadhar No</p>
                      <p className="font-semibold">
                        {selectedStudent.aadharNo || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b border-r">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Room</p>
                      <p className="font-semibold">
                        {getRoomNo(selectedStudent)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b">
                    <Bed className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Bed</p>
                      <p className="font-semibold">
                        {getBedNo(selectedStudent)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b border-r">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Floor</p>
                      <p className="font-semibold">
                        {getFloorNo(selectedStudent)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-semibold">
                        {selectedStudent.joiningDate || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-r">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Paid Amount
                      </p>
                      <p className="font-semibold text-green-600">
                        ₹{formatMoney(selectedStudent.paidAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Due Amount</p>
                      <p
                        className={
                          Number(selectedStudent.dueAmount || 0) > 0
                            ? "font-semibold text-red-600"
                            : "font-semibold text-green-600"
                        }
                      >
                        ₹{formatMoney(selectedStudent.dueAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={() => remove(selectedStudent)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>

                  <Button onClick={startEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            )}

            {(mode === "create" || mode === "edit") && (
              <form onSubmit={save} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input
                      required
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input
                      required
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Phone Number</Label>
                  <Input
                    required
                    value={form.phoneNo}
                    onChange={(e) =>
                      setForm({ ...form, phoneNo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Aadhar Number</Label>
                  <Input
                    required
                    value={form.aadharNo}
                    onChange={(e) =>
                      setForm({ ...form, aadharNo: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Joining Date</Label>
                  <div className="relative">
                    <CalendarDays className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="date"
                      required
                      className="pl-9 h-11 rounded-xl"
                      value={form.joiningDate}
                      onChange={(e) =>
                        setForm({ ...form, joiningDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                {mode === "create" && (
                  <div className="space-y-3">
                    <div>
                      <Label>Assign Bed</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Search by room number, floor number, or bed number.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9 h-11 rounded-xl"
                        placeholder="Search room, floor, or bed..."
                        value={bedSearch}
                        onChange={(e) => setBedSearch(e.target.value)}
                      />
                    </div>

                    {selectedBed && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="font-semibold text-green-900">
                              Room {getAvailableBedRoomNo(selectedBed)} • Bed{" "}
                              {getAvailableBedNo(selectedBed)}
                            </p>
                            <p className="text-xs text-green-700">
                              Floor {getAvailableBedFloorNo(selectedBed)}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setForm({ ...form, bedId: "" })}
                          className="text-green-800 hover:text-green-900 hover:bg-green-100"
                        >
                          Change
                        </Button>
                      </div>
                    )}

                    <div className="rounded-xl border bg-card overflow-hidden">
                      <div className="max-h-64 overflow-y-auto p-2 space-y-2">
                        {beds.length === 0 ? (
                          <div className="p-5 text-center text-sm text-muted-foreground">
                            No available beds
                          </div>
                        ) : filteredBeds.length === 0 ? (
                          <div className="p-5 text-center text-sm text-muted-foreground">
                            No beds match your search
                          </div>
                        ) : (
                          filteredBeds.map((bed) => {
                            const roomNo = getAvailableBedRoomNo(bed);
                            const bedNo = getAvailableBedNo(bed);
                            const floorNo = getAvailableBedFloorNo(bed);
                            const selected =
                              String(form.bedId) === String(bed.id);

                            return (
                              <button
                                key={bed.id}
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    bedId: String(bed.id),
                                  })
                                }
                                className={`w-full rounded-xl border p-3 text-left transition flex items-center justify-between gap-3 ${
                                  selected
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:bg-muted"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                                      selected
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    <DoorOpen className="h-5 w-5" />
                                  </div>

                                  <div>
                                    <p className="font-semibold">
                                      Room {roomNo} • Bed {bedNo}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Floor {floorNo}
                                    </p>
                                  </div>
                                </div>

                                {selected && (
                                  <span className="text-xs font-semibold text-primary">
                                    Selected
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (mode === "edit") {
                        setMode("profile");
                      } else {
                        setOpen(false);
                      }
                    }}
                  >
                    Cancel
                  </Button>

                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    {mode === "edit" ? "Save changes" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>

            {paymentStudent && (
              <div className="space-y-4">
                <div className="rounded-xl border p-4 space-y-3">
                  <div>
                    <p className="font-semibold">
                      {paymentStudent.firstName} {paymentStudent.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Room {getRoomNo(paymentStudent)} • Bed{" "}
                      {getBedNo(paymentStudent)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Rent</p>
                      <p className="font-semibold">
                        ₹{formatMoney(paymentStudent.monthlyRent)}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Paid</p>
                      <p className="font-semibold text-green-600">
                        ₹{formatMoney(paymentStudent.paidAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Due</p>
                      <p className="font-semibold text-red-600">
                        ₹{formatMoney(paymentStudent.dueAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Amount paid now</Label>
                  <Input
                    type="number"
                    min="1"
                    max={Number(paymentStudent.dueAmount || 0)}
                    placeholder="Enter amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPaymentOpen(false)}
                  >
                    Cancel
                  </Button>

                  <Button onClick={savePaymentAmount} disabled={paymentSaving}>
                    {paymentSaving && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Save Payment
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}