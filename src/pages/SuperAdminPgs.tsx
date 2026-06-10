import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Loader2,
  LogOut,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api, ApiError } from "@/lib/api";
import { LoadingState, ErrorState } from "@/components/DataState";
import EmptyState from "@/components/EmptyState";
import { useAuth } from "@/context/AuthContext";
import CreateOwnerModal from "./CreateOwner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OwnerSummary {
  ownerId: number | string;
  ownerName?: string;
  ownerUsername?: string;
  totalPgs?: number;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionActive?: boolean;
  subscriptionStartDate?: string;
  subscriptionExpiryDate?: string;
}

type OwnerForm = {
  subscriptionPlan: string;
  subscriptionActive: boolean;
  subscriptionStartDate: string;
  subscriptionExpiryDate: string;
};

type ExpiryStatus = "expired" | "soon" | "safe";

export default function SuperAdminPgs() {
  const navigate = useNavigate();
  const { creds, logout } = useAuth();

  const [owners, setOwners] = useState<OwnerSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [apiMissing, setApiMissing] = useState(false);
  const [createOwnerOpen, setCreateOwnerOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    setApiMissing(false);

    try {
      const data = await api.listOwners();
      setOwners(Array.isArray(data) ? (data as OwnerSummary[]) : []);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
        setApiMissing(true);
        setOwners([]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 px-4 py-2 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-8xl items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950">
              StayOps
            </h1>
            <p className="text-xs font-medium text-slate-500">{creds?.role}</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setCreateOwnerOpen(true)}
              className="gap-1.5 text-white shadow-lg transition-all hover:scale-105 hover:shadow-blue-200"
            >
              <Plus className="h-4 w-4" />
              Add Owner
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 p-4">
        {loading && <LoadingState label="Loading owners..." />}
        {!loading && error && <ErrorState error={error} />}

        {!loading && apiMissing && (
          <div className="rounded-xl border bg-white p-4 text-sm text-slate-500">
            Backend API not available: GET /owners.
          </div>
        )}

        {!loading && !error && owners && owners.length === 0 && !apiMissing && (
          <EmptyState
            title="No owners found"
            description="Create the first owner to start adding PGs."
          />
        )}

        {!loading && !error && owners && owners.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...owners]
            .sort((a, b) => {
              const aTime = new Date(a.subscriptionExpiryDate || "1900-01-01").getTime();
              const bTime = new Date(b.subscriptionExpiryDate || "1900-01-01").getTime();

              return aTime - bTime;
            })
            .map((owner, index) => (
              <OwnerCard
                key={owner.ownerId}
                owner={owner}
                index={index}
                onOpen={() => navigate(`/owners/${owner.ownerId}`)}
                onUpdated={refresh}
              />
            ))}
          </div>
        )}
      </main>

      <CreateOwnerModal
        open={createOwnerOpen}
        onClose={() => setCreateOwnerOpen(false)}
        onCreated={refresh}
      />
    </div>
  );
}

function addDays(dateStr: string, days: number) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateStr: string, months: number) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function monthDiff(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);

  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  if (end.getDate() < start.getDate()) months--;

  return months;
}

function planFromDates(startDate: string, expiryDate: string) {
  const months = monthDiff(startDate, expiryDate);

  if (months >= 12) return "YEARLY";
  if (months >= 3) return "QUARTERLY";
  return "MONTHLY";
}

function expiryFromPlan(startDate: string, plan: string) {
  if (plan === "TRIAL") return addDays(startDate, 7);
  if (plan === "MONTHLY") return addMonths(startDate, 1);
  if (plan === "QUARTERLY") return addMonths(startDate, 3);
  if (plan === "YEARLY") return addMonths(startDate, 12);

  return addDays(startDate, 7);
}

function OwnerCard({
  owner,
  index,
  onOpen,
  onUpdated,
}: {
  owner: OwnerSummary;
  index: number;
  onOpen: () => void;
  onUpdated: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<OwnerForm>(() => ownerToForm(owner));

  useEffect(() => {
    setForm(ownerToForm(owner));
  }, [owner]);

  const expiryInfo = getExpiryInfo(form.subscriptionExpiryDate);

  const isAccessActive =
    form.subscriptionActive === true && expiryInfo.status !== "expired";

  const initials = getInitials(owner.ownerName || `Owner ${owner.ownerId}`);

  async function saveChanges(nextForm: OwnerForm) {
    if (!nextForm.subscriptionStartDate || !nextForm.subscriptionExpiryDate) {
      toast.error("Start date and expiry date are required");
      return;
    }

    const previousForm = form;

    setForm(nextForm);
    setSaving(true);
    setSaved(false);

    try {
      const updatedOwner = (await api.updateOwnerSubscription(owner.ownerId, {
        subscriptionPlan: nextForm.subscriptionPlan,
        subscriptionActive: nextForm.subscriptionActive,
        subscriptionStartDate: nextForm.subscriptionStartDate,
        subscriptionExpiryDate: nextForm.subscriptionExpiryDate,
      })) as OwnerSummary | undefined;

      if (updatedOwner) {
        setForm(ownerToForm(updatedOwner));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
      onUpdated();
    } catch (err) {
      setForm(previousForm);

      toast.error(
        err instanceof ApiError
          ? err.message
          : "Failed to update subscription"
      );
    } finally {
      setSaving(false);
    }
  }

  function updateForm<K extends keyof OwnerForm>(
    key: K,
    value: OwnerForm[K]
  ) {
    let nextForm: OwnerForm = { ...form, [key]: value };

    if (key === "subscriptionPlan") {
      const plan = String(value);

      nextForm = {
        ...nextForm,
        subscriptionPlan: plan,
        subscriptionExpiryDate: expiryFromPlan(
          form.subscriptionStartDate,
          plan
        ),
      };
    }

    if (key === "subscriptionStartDate") {
      const startDate = String(value);

      nextForm = {
        ...nextForm,
        subscriptionStartDate: startDate,
        subscriptionExpiryDate: expiryFromPlan(
          startDate,
          form.subscriptionPlan
        ),
      };
    }

    if (key === "subscriptionExpiryDate") {
      const expiryDate = String(value);
      const nextExpiryInfo = getExpiryInfo(expiryDate);

      nextForm = {
        ...nextForm,
        subscriptionExpiryDate: expiryDate,
        subscriptionActive: nextExpiryInfo.status !== "expired",
      };

      if (form.subscriptionPlan !== "TRIAL") {
        nextForm.subscriptionPlan = planFromDates(
          form.subscriptionStartDate,
          expiryDate
        );
      }
    }

    saveChanges(nextForm);
  }

  return (
    <Card
      style={{ animationDelay: `${index * 90}ms` }}
      className={`owner-card-animation group overflow-hidden rounded-3xl border bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015] hover:shadow-xl ${
        expiryInfo.status === "expired"
          ? "border-red-200"
          : expiryInfo.status === "soon"
          ? "border-orange-200"
          : "border-slate-200"
      }`}
    >
      <div className="mb-5 flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-300 text-lg font-black text-white shadow-lg transition-all duration-300 group-hover:rotate-3 group-hover:scale-110">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-black leading-tight text-slate-950">
            {owner.ownerName || `Owner ${owner.ownerId}`}
          </p>
          <p className="truncate text-sm font-medium text-slate-500">
            @{owner.ownerUsername || "username"}
          </p>
        </div>

        <div className="h-6">
          {saving && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          {saved && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <MiniMetric label="PGs" value={owner.totalPgs ?? 0} />
        <MiniMetric label="Status" value={isAccessActive ? "Active" : "Inactive"} />
      </div>

      <div className="space-y-3">
        <FancyRow
          label="Plan"
          value={
            <Select
              value={form.subscriptionPlan}
              disabled={saving}
              onValueChange={(value) => updateForm("subscriptionPlan", value)}
            >
              <SelectTrigger className="h-9 w-44 rounded-xl border-blue-100 bg-blue-50 font-bold text-blue-700 shadow-sm transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIAL">🚀 Trial</SelectItem>
                <SelectItem value="MONTHLY">💼 MONTHLY</SelectItem>
                <SelectItem value="QUARTERLY">⭐ QUARTERLY</SelectItem>
                <SelectItem value="YEARLY">👑 YEARLY</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        <FancyRow
          label="Access"
          value={
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${
                  isAccessActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isAccessActive ? "ACTIVE" : "INACTIVE"}
              </span>

              <Switch
                checked={isAccessActive}
                disabled={saving}
                onCheckedChange={(checked) =>
                  updateForm("subscriptionActive", checked)
                }
              />
            </div>
          }
        />

        <DateRow
          label="Start"
          value={form.subscriptionStartDate}
          disabled={saving}
          onChange={(value) => updateForm("subscriptionStartDate", value)}
        />

        <DateRow
          label="Expiry"
          value={form.subscriptionExpiryDate}
          disabled={saving}
          danger={expiryInfo.status === "expired"}
          warning={expiryInfo.status === "soon"}
          onChange={(value) => updateForm("subscriptionExpiryDate", value)}
        />

        <div
          className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
            expiryInfo.status === "expired"
              ? "bg-red-50 text-red-700 border border-red-200 shadow-[0_8px_25px_rgba(239,68,68,0.12)]"
              : expiryInfo.status === "soon"
              ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-[0_8px_25px_rgba(249,115,22,0.12)]"
              : expiryInfo.daysRemaining > 180
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-[0_8px_25px_rgba(16,185,129,0.15)]"
              : expiryInfo.daysRemaining > 90
              ? "bg-green-50 text-green-700 border border-green-200 shadow-[0_8px_25px_rgba(34,197,94,0.12)]"
              : "bg-lime-50 text-lime-700 border border-lime-200 shadow-[0_8px_25px_rgba(132,204,22,0.12)]"
          }`}
        >
          {expiryInfo.text}
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <Button
          size="sm"
          variant="outline"
          className="h-11 w-full gap-2 rounded-2xl font-bold transition-all duration-300 hover:scale-[1.02] hover:bg-blue-600 hover:text-white"
          onClick={onOpen}
        >
          <Building2 className="h-4 w-4" />
          Open Owner PGs
        </Button>
      </div>
    </Card>
  );
}

function ownerToForm(owner: OwnerSummary): OwnerForm {
  const expiryInfo = getExpiryInfo(owner.subscriptionExpiryDate || "");

  return {
    subscriptionPlan: owner.subscriptionPlan || "TRIAL",
    subscriptionActive:
      expiryInfo.status === "expired"
        ? false
        : owner.subscriptionActive ?? owner.subscriptionStatus === "ACTIVE",
    subscriptionStartDate: owner.subscriptionStartDate || "",
    subscriptionExpiryDate: owner.subscriptionExpiryDate || "",
  };
}

function MiniMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function FancyRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition-all duration-300 hover:bg-blue-50 hover:shadow-sm">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      {value}
    </div>
  );
}

function DateRow({
  label,
  value,
  onChange,
  disabled,
  danger,
  warning,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  danger?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-all duration-300 hover:shadow-sm ${
        danger
          ? "bg-red-50"
          : warning
          ? "bg-orange-50"
          : "bg-slate-50 hover:bg-blue-50"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        <CalendarDays className="h-4 w-4" />
        {label}
      </span>

      <Input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`
          h-9 w-40 rounded-xl border bg-white text-right font-bold shadow-sm
          ${danger ? "border-red-200 text-red-700" : ""}
          ${warning ? "border-orange-200 text-orange-700" : ""}
        `}
      />
    </div>
  );
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getExpiryInfo(expiryDate: string): {
  status: ExpiryStatus;
  text: string;
  daysRemaining: number;
} {
  if (!expiryDate) {
    return {
      status: "soon",
      text: "Expiry date not set",
      daysRemaining: 0,
    };
  }

  const today = new Date();
  const expiry = new Date(expiryDate + "T00:00:00");

  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    const days = Math.abs(diffDays);

    return {
      status: "expired",
      text:
        days === 0
          ? "Expired today"
          : `Expired ${days} day${days === 1 ? "" : "s"} ago`,
      daysRemaining: diffDays,
    };
  }

  if (diffDays <= 7) {
    return {
      status: "soon",
      text: `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
      daysRemaining: diffDays,
    };
  }

  return {
    status: "safe",
    text: `Active for ${diffDays} more days`,
    daysRemaining: diffDays,
  };
}
