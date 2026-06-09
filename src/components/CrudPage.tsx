import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ArrowLeft, Pencil, Plus, Trash2, Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "tel";
  required?: boolean;
}

interface Props<T extends { id: number }> {
  title: string;
  fields: FieldDef[];
  list: () => Promise<unknown[]>;
  create: (b: Record<string, unknown>) => Promise<unknown>;
  update: (id: number, b: Record<string, unknown>) => Promise<unknown>;
  remove: (id: number) => Promise<unknown>;
  mutateRoles?: ("SUPER_ADMIN" | "ADMIN" | "WARDEN")[];
  deleteRoles?: ("SUPER_ADMIN" | "ADMIN" | "WARDEN")[];
}

export default function CrudPage<T extends { id: number; [k: string]: unknown }>({
  title,
  fields,
  list,
  create,
  update,
  remove,
  mutateRoles = ["SUPER_ADMIN", "ADMIN", "WARDEN"],
  deleteRoles,
}: Props<T>) {
  const navigate = useNavigate();
  const { pgId } = useParams();

  const { creds } = useAuth();
  const role = creds?.role;
  const canMutate = !!role && mutateRoles.includes(role);
  const canDelete =
    !!role &&
    (deleteRoles ?? mutateRoles.filter((r) => r !== "WARDEN")).includes(role);

  const [items, setItems] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const d = await list();
      setItems(d as T[]);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function goToDashboard() {
    if (pgId) {
      navigate(`/pg/${pgId}/dashboard`);
      return;
    }

    const savedPgId = localStorage.getItem("pg_selected_id");
    if (savedPgId) {
      navigate(`/pg/${savedPgId}/dashboard`);
      return;
    }

    navigate("/");
  }

  function blank() {
    const f: Record<string, string> = {};
    fields.forEach((x) => {
      f[x.key] = "";
    });
    return f;
  }

  function openCreate() {
    setEditing(null);
    setForm(blank());
    setOpen(true);
  }

  function openEdit(it: T) {
    setEditing(it);

    const f = blank();
    fields.forEach((x) => {
      const v = it[x.key];
      f[x.key] = v == null ? "" : String(v);
    });

    setForm(f);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        const body: Record<string, unknown> = {};

        fields.forEach((x) => {
          const orig = editing[x.key];
          const origStr = orig == null ? "" : String(orig);
          const cur = form[x.key] ?? "";

          if (cur !== origStr) {
            body[x.key] =
              cur === "" ? null : x.type === "number" ? Number(cur) : cur;
          }
        });

        if (Object.keys(body).length === 0) {
          toast.info("No changes to save");
          setSaving(false);
          return;
        }

        await update(editing.id, body);
        toast.success(`${title} updated`);
      } else {
        const body: Record<string, unknown> = {};

        fields.forEach((x) => {
          const v = form[x.key];

          if (v === "" || v == null) return;

          body[x.key] = x.type === "number" ? Number(v) : v;
        });

        await create(body);
        toast.success(`${title} created`);
      }

      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function del(it: T) {
    if (!confirm(`Delete this ${title.toLowerCase()}?`)) return;

    try {
      await remove(it.id);
      toast.success("Deleted");
      refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goToDashboard}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="text-2xl font-bold">{title}</h1>
        </div>

        {canMutate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add {title.replace(/s$/, "")}
          </Button>
        )}
      </div>

      <Card>
        {loading && <LoadingState />}

        {!loading && error && (
          <div className="p-4">
            <ErrorState error={error} />
          </div>
        )}

        {!loading && !error && (!items || items.length === 0) && (
          <EmptyState title={`No ${title.toLowerCase()}`} />
        )}

        {!loading && !error && items && items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((f) => (
                  <TableHead key={f.key}>{f.label}</TableHead>
                ))}
                {(canMutate || canDelete) && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.map((it) => (
                <TableRow key={it.id}>
                  {fields.map((f) => (
                    <TableCell key={f.key}>
                      {(it[f.key] as string) ?? "-"}
                    </TableCell>
                  ))}

                  {(canMutate || canDelete) && (
                    <TableCell className="text-right">
                      {canMutate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(it)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => del(it)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${title}` : `Add ${title}`}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={save} className="space-y-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type={f.type || "text"}
                  required={f.required}
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                />
              </div>
            ))}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
                {saving && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}