import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Crown,
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

  const stats = useMemo(() => {
    const list = owners || [];
    return {
      totalOwners: list.length,
      totalPgs: list.reduce((sum, o) => sum + (o.totalPgs ?? 0), 0),
      active: list.filter(
        (o) => o.subscriptionActive ?? o.subscriptionStatus === "ACTIVE"
      ).length,
      inactive: list.filter(
        (o) => !(o.subscriptionActive ?? o.subscriptionStatus === "ACTIVE")
      ).length,
    };
  }, [owners]);

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
            {owners.map((owner, index) => (
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

  const [form, setForm] = useState<OwnerForm>({
    subscriptionPlan: owner.subscriptionPlan || "TRIAL",
    subscriptionActive:
      owner.subscriptionActive ?? owner.subscriptionStatus === "ACTIVE",
    subscriptionStartDate: owner.subscriptionStartDate || "",
    subscriptionExpiryDate: owner.subscriptionExpiryDate || "",
  });

  const expiryInfo = getExpiryInfo(form.subscriptionExpiryDate);
  const initials = getInitials(owner.ownerName || `Owner ${owner.ownerId}`);

  async function saveChanges(nextForm: OwnerForm) {
    if (!nextForm.subscriptionStartDate || !nextForm.subscriptionExpiryDate) {
      toast.error("Start date and expiry date are required");
      return;
    }
  
    const previousForm = form;
  
    setSaving(true);
    setSaved(false);
  
    try {
      await api.updateOwnerSubscription(owner.ownerId, {
        subscriptionPlan: nextForm.subscriptionPlan,
        subscriptionActive: nextForm.subscriptionActive,
        subscriptionStartDate: nextForm.subscriptionStartDate,
        subscriptionExpiryDate: nextForm.subscriptionExpiryDate,
      });
  
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
    const nextForm = { ...form, [key]: value };
  
    saveChanges(nextForm);
  }

  return (
    <Card
    style={{ animationDelay: `${index * 90}ms` }}
      className={`
        owner-card-animation group overflow-hidden rounded-3xl border bg-white p-5
        shadow-lg transition-all duration-300 hover:-translate-y-2 hover:scale-[1.015]
        ${expiryInfo.status === "expired" ? "border-red-300" : ""}
        ${expiryInfo.status === "soon" ? "border-orange-300" : ""}
        ${expiryInfo.status === "safe" ? "hover:border-blue-400" : ""}
      `}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 opacity-80" />

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
        <MiniMetric label="Status" value={form.subscriptionActive ? "Active" : "Off"} />
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
              <SelectTrigger className="h-9 w-36 rounded-xl border-blue-100 bg-blue-50 font-bold text-blue-700 shadow-sm transition-all hover:border-blue-300">
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
                  form.subscriptionActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {form.subscriptionActive ? "ACTIVE" : "INACTIVE"}
              </span>
              <Switch
                checked={form.subscriptionActive}
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
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            expiryInfo.status === "expired"
              ? "bg-red-50 text-red-700"
              : expiryInfo.status === "soon"
              ? "bg-orange-50 text-orange-700"
              : "bg-green-50 text-green-700"
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="rounded-2xl border bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </Card>
  );
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

function getExpiryInfo(expiryDate: string) {
  if (!expiryDate) {
    return { status: "soon", text: "Expiry date not set" };
  }

  const today = new Date();
  const expiry = new Date(expiryDate + "T00:00:00");

  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      status: "expired",
      text: `Expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`,
    };
  }

  if (diffDays <= 7) {
    return {
      status: "soon",
      text: `Expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
    };
  }

  return {
    status: "safe",
    text: `Active for ${diffDays} more days`,
  };
}
