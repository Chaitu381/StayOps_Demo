import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BedDouble,
  Phone,
  IdCard,
  CalendarDays,
  Building2,
  IndianRupee,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import { motion } from "framer-motion";

import { api, ApiError } from "@/lib/api";

import EmptyState from "@/components/EmptyState";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

interface Room {
  id: number | string;
  roomNo?: number | string;
  roomNumber?: number | string;
  floorNo?: number | string;
}

interface Student {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  aadharNo?: string;
  joiningDate?: string;

  paidUn?: boolean;
  fullyPaid?: boolean;
  monthlyRent?: number;
  paidAmount?: number;
  dueAmount?: number;

  bedId?: number | string;
  bedCode?: string;
  roomNo?: number | string;
  floorNo?: number | string;

  bed?: {
    id?: number | string;
    bedNo?: number | string;
    bedCode?: string;
    room?: {
      roomNo?: number | string;
      floorNo?: number | string;
    } | null;
  } | null;
}

interface Bed {
  id: number | string;
  bedCode?: string;
  bedNo?: number | string;

  status?: string;
  bedStatus?: string;

  occupied?: boolean;
  isOccupied?: boolean;

  studentId?: number | string | null;

  student?: Student | null;

  roomId?: number | string;
  room_id?: number | string;

  roomNo?: number | string;
  roomNumber?: number | string;

  floorNo?: number | string;

  room?: Room;
}

function getRoomNoFromBedCode(
  bedCode: unknown
) {
  if (bedCode == null) return null;

  const text = String(bedCode).trim();

  if (!text.includes("-")) return null;

  return text.split("-")[0];
}

function getFloorFromRoomNo(
  roomNo: unknown
) {
  if (roomNo == null) return null;

  const text = String(roomNo).trim();

  if (!text) return null;

  return text.charAt(0);
}

function getBedRoomNo(bed: Bed) {
  return (
    bed.roomNo ??
    bed.roomNumber ??
    bed.room?.roomNo ??
    getRoomNoFromBedCode(
      bed.bedCode
    )
  );
}

function isOccupied(bed: Bed) {
  const status = String(
    bed.status ??
      bed.bedStatus ??
      ""
  )
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

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString(
    "en-IN"
  );
}

function isStudentPaid(
  student: Student
) {
  if (student.paidUn === true)
    return true;

  if (student.fullyPaid === true)
    return true;

  const monthlyRent = Number(
    student.monthlyRent || 0
  );

  const paidAmount = Number(
    student.paidAmount || 0
  );

  const dueAmount = Number(
    student.dueAmount || 0
  );

  return (
    monthlyRent > 0 &&
    paidAmount >= monthlyRent &&
    dueAmount <= 0
  );
}

function getStudentInitials(
  student: Student
) {
  return (
    `${student.firstName?.[0] || ""}${
      student.lastName?.[0] || ""
    }`.toUpperCase() || "ST"
  );
}

function getStudentRoomNo(
  student: Student
) {
  const bedCode =
    student.bedCode ||
    student.bed?.bedCode;

  if (student.roomNo)
    return student.roomNo;

  if (student.bed?.room?.roomNo) {
    return student.bed.room.roomNo;
  }

  if (
    bedCode &&
    bedCode.includes("-")
  ) {
    return bedCode.split("-")[0];
  }

  return "-";
}

function getStudentBedNo(
  student: Student
) {
  if (student.bed?.bedNo)
    return student.bed.bedNo;

  const bedCode =
    student.bedCode ||
    student.bed?.bedCode;

  if (
    bedCode &&
    bedCode.includes("-")
  ) {
    return bedCode.split("-")[1];
  }

  return student.bedId || "-";
}

function getStudentFloorNo(
  student: Student
) {
  if (student.floorNo)
    return student.floorNo;

  if (student.bed?.room?.floorNo) {
    return student.bed.room.floorNo;
  }

  const roomNo =
    getStudentRoomNo(student);

  if (roomNo !== "-") {
    return String(roomNo).charAt(0);
  }

  return "-";
}

function mergeBedIntoStudent(
  student: Student,
  bed: Bed
): Student {
  return {
    ...student,

    bedId:
      student.bedId ?? bed.id,

    bedCode:
      student.bedCode ??
      bed.bedCode,

    roomNo:
      student.roomNo ??
      getBedRoomNo(bed) ??
      undefined,

    floorNo:
      student.floorNo ??
      bed.floorNo ??
      bed.room?.floorNo ??
      getFloorFromRoomNo(
        getBedRoomNo(bed)
      ) ??
      undefined,

    bed: {
      ...(student.bed || {}),

      id:
        student.bed?.id ??
        bed.id,

      bedNo:
        student.bed?.bedNo ??
        bed.bedNo,

      bedCode:
        student.bed?.bedCode ??
        bed.bedCode,

      room: {
        ...(student.bed?.room ||
          {}),

        roomNo:
          student.bed?.room
            ?.roomNo ??
          getBedRoomNo(bed) ??
          undefined,

        floorNo:
          student.bed?.room
            ?.floorNo ??
          bed.floorNo ??
          bed.room?.floorNo ??
          getFloorFromRoomNo(
            getBedRoomNo(bed)
          ) ??
          undefined,
      },
    },
  };
}

export default function RoomDetail() {
  const { roomId } = useParams();

  const navigate = useNavigate();

  const [rooms, setRooms] =
    useState<Room[]>([]);

  const [beds, setBeds] =
    useState<Bed[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [open, setOpen] =
    useState(false);

  const [mode, setMode] =
    useState<"profile" | "edit">(
      "profile"
    );

  const [saving, setSaving] =
    useState(false);

  const [paymentOpen, setPaymentOpen] =
    useState(false);

  const [paymentAmount, setPaymentAmount] =
    useState("");

  const [paymentSaving, setPaymentSaving] =
    useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNo: "",
    aadharNo: "",
    joiningDate: "",
  });

  async function loadData() {
    setLoading(true);

    try {
      const [
        roomsData,
        bedsData,
        studentsData,
      ] = await Promise.all([
        api.listRooms().catch(() => []),
        api.listBeds().catch(() => []),
        api
          .listStudents()
          .catch(() => []),
      ]);

      setRooms(
        Array.isArray(roomsData)
          ? roomsData
          : []
      );

      setBeds(
        Array.isArray(bedsData)
          ? bedsData
          : []
      );

      setStudents(
        Array.isArray(studentsData)
          ? studentsData
          : []
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const room = useMemo(() => {
    return rooms.find((r) => {
      const currentRoomNo =
        r.roomNo ??
        r.roomNumber;

      return (
        String(r.id) ===
          String(roomId) ||
        String(currentRoomNo) ===
          String(roomId)
      );
    });
  }, [rooms, roomId]);

  const roomNo =
    room?.roomNo ??
    room?.roomNumber ??
    roomId;

  const floorNo =
    room?.floorNo ??
    getFloorFromRoomNo(roomNo);

  const roomBeds = useMemo(() => {
    return beds.filter((bed) => {
      const bedRoomNo =
        getBedRoomNo(bed);

      return (
        String(bedRoomNo) ===
        String(roomNo)
      );
    });
  }, [beds, roomNo]);

  function findStudentForBed(
    bed: Bed
  ): Student | null {
    if (bed.student) {
      return mergeBedIntoStudent(
        bed.student,
        bed
      );
    }

    const found = students.find(
      (student) => {
        const studentBedId =
          student.bedId ??
          student.bed?.id;

        const studentBedCode =
          student.bedCode ??
          student.bed?.bedCode;

        return (
          String(studentBedId) ===
            String(bed.id) ||
          String(studentBedCode) ===
            String(bed.bedCode) ||
          String(student.id) ===
            String(bed.studentId)
        );
      }
    );

    return found
      ? mergeBedIntoStudent(
          found,
          bed
        )
      : null;
  }

  function openProfile(
    student: Student
  ) {
    setSelectedStudent({
      ...student,
    });

    setMode("profile");

    setOpen(true);
  }

  function startEdit() {
    if (!selectedStudent) return;

    setMode("edit");

    setForm({
      firstName:
        selectedStudent.firstName ||
        "",

      lastName:
        selectedStudent.lastName ||
        "",

      phoneNo:
        selectedStudent.phoneNo ||
        "",

      aadharNo:
        selectedStudent.aadharNo ||
        "",

      joiningDate:
        selectedStudent.joiningDate ||
        "",
    });
  }

  async function saveStudent(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!selectedStudent) return;

    setSaving(true);

    try {
      await api.updateStudent(
        selectedStudent.id,
        form
      );

      toast.success(
        "Student updated"
      );

      await loadData();

      setSelectedStudent({
        ...selectedStudent,
        ...form,
      });

      setMode("profile");
    } catch (e) {
      toast.error(
        e instanceof ApiError
          ? e.message
          : "Update failed"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent() {
    if (!selectedStudent) return;

    if (
      !confirm(
        `Delete ${selectedStudent.firstName}?`
      )
    ) {
      return;
    }

    try {
      await api.deleteStudent(
        selectedStudent.id
      );

      toast.success(
        "Student deleted"
      );

      setOpen(false);

      setSelectedStudent(null);

      await loadData();
    } catch {
      toast.error("Delete failed");
    }
  }

  async function togglePayment() {
    if (!selectedStudent) return;

    try {
      await api.toggleStudentPayment(
        selectedStudent.id
      );

      await loadData();

      const updated = {
        ...selectedStudent,

        paidUn:
          !isStudentPaid(
            selectedStudent
          ),

        fullyPaid:
          !isStudentPaid(
            selectedStudent
          ),
      };

      setSelectedStudent(updated);

      toast.success(
        "Payment updated"
      );
    } catch {
      toast.error(
        "Payment update failed"
      );
    }
  }

  async function savePaymentAmount() {
    if (!selectedStudent) return;

    const amountPaidNow =
      Number(paymentAmount);

    const currentDue = Number(
      selectedStudent.dueAmount || 0
    );

    if (
      !paymentAmount ||
      amountPaidNow <= 0
    ) {
      toast.error(
        "Enter valid amount"
      );

      return;
    }

    if (
      amountPaidNow > currentDue
    ) {
      toast.error(
        "Amount exceeds due"
      );

      return;
    }

    setPaymentSaving(true);

    try {
      const updatedStudent =
        await api.updateDueAmount(
          selectedStudent.id,
          currentDue -
            amountPaidNow
        );

      setSelectedStudent(
        updatedStudent as Student
      );

      toast.success(
        "Payment updated"
      );

      setPaymentOpen(false);

      await loadData();
    } catch {
      toast.error(
        "Payment failed"
      );
    } finally {
      setPaymentSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 shadow-sm flex items-center gap-3">
        <button
          onClick={() =>
            navigate(-1)
          }
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold">
            Room {roomNo}
          </h1>

          <p className="text-xs text-muted-foreground">
            Floor {floorNo}
          </p>
        </div>
      </header>

      <div className="p-4 max-w-5xl mx-auto">
        {loading ? (
          <p>Loading...</p>
        ) : roomBeds.length === 0 ? (
          <EmptyState
            title="No beds found"
            description="This room has no beds."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {roomBeds.map(
              (bed, index) => {
                const occupied =
                  isOccupied(bed);

                const student =
                  findStudentForBed(
                    bed
                  );

                return (
                  <motion.div
                    key={String(
                      bed.id
                    )}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay:
                        index * 0.03,
                    }}
                    whileHover={{
                      y: -3,
                    }}
                    onClick={() => {
                      if (
                        occupied &&
                        student
                      ) {
                        openProfile(
                          student
                        );
                      }
                    }}
                    className={`rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all ${
                      occupied
                        ? "border-rose-200 cursor-pointer hover:bg-rose-50"
                        : "border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                          occupied
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        <BedDouble className="h-6 w-6" />
                      </div>

                      <span
                        className={
                          occupied
                            ? "text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-700"
                            : "text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-700"
                        }
                      >
                        {occupied
                          ? "OCCUPIED"
                          : "VACANT"}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold">
                      Bed{" "}
                      {bed.bedNo ??
                        String(
                          bed.bedCode ??
                            ""
                        ).split(
                          "-"
                        )[1] ??
                        bed.id}
                    </h2>

                    <p className="text-sm text-muted-foreground mt-1">
                      Code:{" "}
                      {bed.bedCode ??
                        "-"}
                    </p>

                    {student && (
                      <div className="mt-4">
                        <p className="font-medium">
                          {
                            student.firstName
                          }{" "}
                          {
                            student.lastName
                          }
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {
                            student.phoneNo
                          }
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              }
            )}
          </div>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit"
                ? "Edit Student"
                : "Student Profile"}
            </DialogTitle>
          </DialogHeader>

          {selectedStudent &&
            mode ===
              "profile" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                      {getStudentInitials(
                        selectedStudent
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        {
                          selectedStudent.firstName
                        }{" "}
                        {
                          selectedStudent.lastName
                        }
                      </h2>

                      <p className="text-sm text-muted-foreground">
                        Student ID:{" "}
                        {
                          selectedStudent.id
                        }
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={
                      togglePayment
                    }
                    className={
                      isStudentPaid(
                        selectedStudent
                      )
                        ? "bg-green-100 text-green-700 hover:bg-green-200 border-0 px-5"
                        : "bg-red-100 text-red-700 hover:bg-red-200 border-0 px-5"
                    }
                  >
                    {isStudentPaid(
                      selectedStudent
                    )
                      ? "Paid"
                      : "Unpaid"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-0 border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-r">
                    <Phone className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Phone
                      </p>

                      <p className="font-semibold">
                        {
                          selectedStudent.phoneNo
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b">
                    <IdCard className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Aadhar
                      </p>

                      <p className="font-semibold">
                        {
                          selectedStudent.aadharNo
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b border-r">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Room
                      </p>

                      <p className="font-semibold">
                        {getStudentRoomNo(
                          selectedStudent
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b">
                    <BedDouble className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Bed
                      </p>

                      <p className="font-semibold">
                        {getStudentBedNo(
                          selectedStudent
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b border-r">
                    <Building2 className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Floor
                      </p>

                      <p className="font-semibold">
                        {getStudentFloorNo(
                          selectedStudent
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-b">
                    <CalendarDays className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Join Date
                      </p>

                      <p className="font-semibold">
                        {
                          selectedStudent.joiningDate
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border-r">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Paid
                      </p>

                      <p className="font-semibold text-green-600">
                        ₹
                        {formatMoney(
                          selectedStudent.paidAmount
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4">
                    <IndianRupee className="h-5 w-5 text-muted-foreground" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Due
                      </p>

                      <p className="font-semibold text-red-600">
                        ₹
                        {formatMoney(
                          selectedStudent.dueAmount
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPaymentOpen(
                        true
                      )
                    }
                  >
                    Add Payment
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={
                      deleteStudent
                    }
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>

                  <Button
                    onClick={
                      startEdit
                    }
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogFooter>
              </div>
            )}

          {selectedStudent &&
            mode === "edit" && (
              <form
                onSubmit={
                  saveStudent
                }
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>
                      First Name
                    </Label>

                    <Input
                      value={
                        form.firstName
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          firstName:
                            e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>
                      Last Name
                    </Label>

                    <Input
                      value={
                        form.lastName
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          lastName:
                            e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>
                    Phone
                  </Label>

                  <Input
                    value={
                      form.phoneNo
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phoneNo:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>
                    Aadhar
                  </Label>

                  <Input
                    value={
                      form.aadharNo
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        aadharNo:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>
                    Join Date
                  </Label>

                  <Input
                    type="date"
                    value={
                      form.joiningDate
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        joiningDate:
                          e.target.value,
                      })
                    }
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setMode(
                        "profile"
                      )
                    }
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    disabled={
                      saving
                    }
                  >
                    {saving && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}

                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentOpen}
        onOpenChange={
          setPaymentOpen
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add Payment
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <p className="font-semibold">
                  {
                    selectedStudent.firstName
                  }{" "}
                  {
                    selectedStudent.lastName
                  }
                </p>

                <p className="text-sm text-muted-foreground">
                  Due: ₹
                  {formatMoney(
                    selectedStudent.dueAmount
                  )}
                </p>
              </div>

              <div>
                <Label>
                  Amount Paid
                </Label>

                <Input
                  type="number"
                  value={
                    paymentAmount
                  }
                  onChange={(e) =>
                    setPaymentAmount(
                      e.target.value
                    )
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPaymentOpen(
                      false
                    )
                  }
                >
                  Cancel
                </Button>

                <Button
                  onClick={
                    savePaymentAmount
                  }
                  disabled={
                    paymentSaving
                  }
                >
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
  );
}
