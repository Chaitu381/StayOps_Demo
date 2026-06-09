import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Coffee,
  Edit,
  Loader2,
  Plus,
  Soup,
  Trash2,
  UtensilsCrossed,
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

type Role = "SUPER_ADMIN" | "ADMIN" | "WARDEN";

interface MenuItem {
  id: number;
  day?: string;
  breakFast?: string[] | string;
  breakfast?: string[] | string;
  lunch?: string[] | string;
  dinner?: string[] | string;
}

interface MenuForm {
  day: string;
  breakFast: string;
  lunch: string;
  dinner: string;
}

const emptyForm: MenuForm = {
  day: "",
  breakFast: "",
  lunch: "",
  dinner: "",
};

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function normalizeDay(value: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function formatDay(value: unknown): string {
  const day = String(value || "").trim();

  if (!day) return "-";

  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (value === null || value === undefined) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function arrayToText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function mealItems(value: unknown): string[] {
  return toTextArray(value);
}

function getBreakfast(item: MenuItem) {
  return item.breakFast ?? item.breakfast ?? [];
}

function toBackendPayload(form: MenuForm) {
  return {
    day: normalizeDay(form.day),

    // Your backend expects breakFast, not breakfast
    breakFast: toTextArray(form.breakFast),

    lunch: toTextArray(form.lunch),
    dinner: toTextArray(form.dinner),
  };
}

function MealBlock({
  title,
  icon: Icon,
  value,
}: {
  title: string;
  icon: typeof Coffee;
  value: unknown;
}) {
  const foods = mealItems(value);

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>

        <p className="text-base font-semibold">{title}</p>
      </div>

      {foods.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {foods.map((food, index) => (
            <span
              key={`${food}-${index}`}
              className="rounded-full border bg-background px-3 py-1 text-sm font-medium"
            >
              {food}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const navigate = useNavigate();
  const { pgId } = useParams();
  const { creds } = useAuth();

  const role = creds?.role as Role | undefined;

  const canEdit = role === "SUPER_ADMIN" || role === "ADMIN";
  const canDelete = role === "SUPER_ADMIN";

  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const data = await api.listMenu();
      setItems(Array.isArray(data) ? (data as MenuItem[]) : []);
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
    if (!canEdit) return;

    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: MenuItem) {
    if (!canEdit) return;

    setEditing(item);

    setForm({
      day: normalizeDay(item.day),
      breakFast: arrayToText(getBreakfast(item)),
      lunch: arrayToText(item.lunch),
      dinner: arrayToText(item.dinner),
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canEdit) {
      toast.error("You do not have permission to change menu");
      return;
    }

    if (!form.day.trim()) {
      toast.error("Day is required");
      return;
    }

    if (!form.breakFast.trim()) {
      toast.error("Breakfast is required");
      return;
    }

    if (!form.lunch.trim()) {
      toast.error("Lunch is required");
      return;
    }

    if (!form.dinner.trim()) {
      toast.error("Dinner is required");
      return;
    }

    setSaving(true);

    try {
      const payload = toBackendPayload(form);

      if (editing) {
        await api.updateMenu(editing.id, payload);
        toast.success("Menu updated");
      } else {
        await api.createMenu(payload);
        toast.success("Menu created");
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

  async function deleteItem(item: MenuItem) {
    if (!canDelete) {
      toast.error("Only Super Admin can delete menu");
      return;
    }

    const ok = window.confirm(`Delete ${formatDay(item.day)} menu?`);
    if (!ok) return;

    try {
      await api.deleteMenu(item.id);
      toast.success("Menu deleted");
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
              <h1 className="text-2xl font-bold text-foreground">
                Food Menu
              </h1>
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "Manage weekly breakfast, lunch, and dinner"
                  : "View weekly food menu"}
              </p>
            </div>
          </div>

          {canEdit && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Menu
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-lg font-bold">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Soup className="h-6 w-6" />
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

        {!loading && !error && items.length === 0 && (
          <Card className="p-6">
            <EmptyState
              title="No menu"
              description={
                canEdit
                  ? "Add your first menu to get started."
                  : "No menu available yet."
              }
            />
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <Card
                key={item.id}
                className="border p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <CalendarDays className="h-6 w-6" />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        {formatDay(item.day)}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Daily meal plan
                      </p>
                    </div>
                  </div>

                  {(canEdit || canDelete) && (
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <MealBlock
                    title="Breakfast"
                    icon={Coffee}
                    value={getBreakfast(item)}
                  />

                  <MealBlock
                    title="Lunch"
                    icon={UtensilsCrossed}
                    value={item.lunch}
                  />

                  <MealBlock title="Dinner" icon={Soup} value={item.dinner} />
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
              <DialogTitle>{editing ? "Edit Menu" : "Add Menu"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={save} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Day</Label>

                <select
                  required
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {formatDay(day)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Breakfast</Label>
                <Input
                  required
                  value={form.breakFast}
                  onChange={(e) =>
                    setForm({ ...form, breakFast: e.target.value })
                  }
                  placeholder="Example: Idli, Dosa, Tea"
                  className="h-11 rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple items with comma.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Lunch</Label>
                <Input
                  required
                  value={form.lunch}
                  onChange={(e) => setForm({ ...form, lunch: e.target.value })}
                  placeholder="Example: Rice, Dal, Curry"
                  className="h-11 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Dinner</Label>
                <Input
                  required
                  value={form.dinner}
                  onChange={(e) =>
                    setForm({ ...form, dinner: e.target.value })
                  }
                  placeholder="Example: Chapati, Potato"
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