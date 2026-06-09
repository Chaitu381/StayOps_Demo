import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Edit,
  IdCard,
  Loader2,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";

interface Worker {
  id: number;
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  aadharNo?: string;
  role?: string;
}

interface WorkerForm {
  firstName: string;
  lastName: string;
  phoneNo: string;
  aadharNo: string;
  role: string;
}

const emptyForm: WorkerForm = {
  firstName: "",
  lastName: "",
  phoneNo: "",
  aadharNo: "",
  role: "",
};

export default function WorkersPage() {
  const navigate = useNavigate();
  const { pgId } = useParams();
  const { creds } = useAuth();

  const canEdit = creds?.role === "SUPER_ADMIN" || creds?.role === "ADMIN";
  const canDelete = creds?.role === "SUPER_ADMIN";

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [form, setForm] = useState<WorkerForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const data = await api.listWorkers();
      setWorkers(Array.isArray(data) ? (data as Worker[]) : []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [pgId]);

  function getWorkerName(worker: Worker) {
    return (
      `${worker.firstName ?? ""} ${worker.lastName ?? ""}`.trim() ||
      `Worker ${worker.id}`
    );
  }

  function getInitials(worker: Worker) {
    const first = worker.firstName?.charAt(0) ?? "";
    const last = worker.lastName?.charAt(0) ?? "";

    return `${first}${last}`.toUpperCase() || "WK";
  }

  function openCreate() {
    if (!canEdit) return;

    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(worker: Worker) {
    if (!canEdit) return;

    setEditing(worker);

    setForm({
      firstName: worker.firstName || "",
      lastName: worker.lastName || "",
      phoneNo: worker.phoneNo || "",
      aadharNo: worker.aadharNo || "",
      role: worker.role || "",
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canEdit) {
      toast.error("You do not have permission to change workers");
      return;
    }

    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    if (!form.lastName.trim()) {
      toast.error("Last name is required");
      return;
    }

    if (!form.phoneNo.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!form.aadharNo.trim()) {
      toast.error("Aadhar number is required");
      return;
    }

    if (!form.role.trim()) {
      toast.error("Role is required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNo: form.phoneNo.trim(),
        aadharNo: form.aadharNo.trim(),
        role: form.role.trim(),
      };

      if (editing) {
        await api.updateWorker(editing.id, payload);
        toast.success("Worker updated");
      } else {
        await api.createWorker(payload);
        toast.success("Worker added");
      }

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorker(worker: Worker) {
    if (!canDelete) {
      toast.error("Only Super Admin can delete workers");
      return;
    }

    const ok = window.confirm(`Delete ${getWorkerName(worker)}?`);
    if (!ok) return;

    try {
      await api.deleteWorker(worker.id);
      toast.success("Worker deleted");
      await refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  function goBack() {
    if (pgId) {
      navigate(`/pg/${pgId}/dashboard`);
      return;
    }

    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-2xl font-bold text-foreground">Workers</h1>
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "Manage staff members and their duties"
                  : "View staff members and duties"}
              </p>
            </div>
          </div>

          {canEdit && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Worker
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Total Workers</p>
                <p className="text-2xl font-bold">{workers.length}</p>
              </div>
            </div>
          </Card>

          <Card className="border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Active Roles</p>
                <p className="text-2xl font-bold">
                  {new Set(workers.map((w) => w.role).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Access</p>
                <p className="text-lg font-bold">
                  {canEdit ? "View & Edit" : "View Only"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {loading && <LoadingState />}

        {!loading && error && (
          <Card className="p-4">
            <ErrorState error={error} />
          </Card>
        )}

        {!loading && !error && workers.length === 0 && (
          <Card className="p-6">
            <EmptyState
              title="No workers"
              description={
                canEdit
                  ? "Add your first worker to get started."
                  : "No worker records available yet."
              }
            />
          </Card>
        )}

        {!loading && !error && workers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workers.map((worker) => (
              <Card
                key={worker.id}
                className="border p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border bg-primary/10 text-lg font-bold text-primary">
                      {getInitials(worker)}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        {getWorkerName(worker)}
                      </h2>

                      <p className="mt-1 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {worker.role || "Worker"}
                      </p>
                    </div>
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(worker)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteWorker(worker)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
                      <Phone className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-semibold">{worker.phoneNo || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
                      <IdCard className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Aadhar</p>
                      <p className="font-semibold">{worker.aadharNo || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-muted-foreground">
                      <BriefcaseBusiness className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Duty</p>
                      <p className="font-semibold">{worker.role || "-"}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!canEdit && (
          <Card className="bg-muted/40 p-4 text-sm text-muted-foreground">
            You have view-only access. Add, edit, and delete actions are hidden
            for your role.
          </Card>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Worker" : "Add Worker"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="h-11 rounded-xl"
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
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  required
                  value={form.phoneNo}
                  onChange={(e) =>
                    setForm({ ...form, phoneNo: e.target.value })
                  }
                  className="h-11 rounded-xl"
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
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role / Duty</Label>
                <Input
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Example: Cook, Cleaner, Security"
                  className="h-11 rounded-xl"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Save changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}