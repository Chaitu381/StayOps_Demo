import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  ShieldCheck,
  UserCog,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";

const empty = {
  pgName: "",
  location: "",
  totalFloors: "",
  roomsPerFloor: "",
  bedsPerRoom: "",
  defaultRent: "",
  adminUsername: "",
  adminPassword: "",
  wardenUsername: "",
  wardenPassword: "",
};

export default function CreatePg() {
  const navigate = useNavigate();
  const { ownerId } = useParams();

  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof empty>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function goBack() {
    navigate(ownerId ? `/owners/${ownerId}` : "/super-admin/pgs");
  }

  function validateForm() {
    const totalFloors = Number(form.totalFloors);
    const roomsPerFloor = Number(form.roomsPerFloor);
    const bedsPerRoom = Number(form.bedsPerRoom);
    const defaultRent = Number(form.defaultRent);

    if (!form.pgName.trim()) {
      toast.error("PG name is required");
      return false;
    }

    if (!form.location.trim()) {
      toast.error("Location is required");
      return false;
    }

    if (!totalFloors || totalFloors < 1) {
      toast.error("Total floors must be at least 1");
      return false;
    }

    if (!roomsPerFloor || roomsPerFloor < 1) {
      toast.error("Rooms per floor must be at least 1");
      return false;
    }

    if (!bedsPerRoom || bedsPerRoom < 1) {
      toast.error("Beds per room must be at least 1");
      return false;
    }

    if (!defaultRent || defaultRent < 1) {
      toast.error("Default monthly rent is required");
      return false;
    }

    if (!form.adminUsername.trim()) {
      toast.error("Admin username is required");
      return false;
    }

    if (!form.adminPassword.trim()) {
      toast.error("Admin password is required");
      return false;
    }

    if (!form.wardenUsername.trim()) {
      toast.error("Warden username is required");
      return false;
    }

    if (!form.wardenPassword.trim()) {
      toast.error("Warden password is required");
      return false;
    }

    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    if (!ownerId) {
      toast.error("Owner ID is missing");
      return;
    }

    const bedsPerRoom = Number(form.bedsPerRoom);

    setSaving(true);

    try {
      await api.createOwnerPg(ownerId, {
        pgName: form.pgName.trim(),
        location: form.location.trim(),
        totalFloors: Number(form.totalFloors),
        roomsPerFloor: Number(form.roomsPerFloor),
        bedsPerRoom,
        defaultBedsPerRoom: bedsPerRoom,
        defaultRent: Number(form.defaultRent),
        adminUsername: form.adminUsername.trim(),
        adminPassword: form.adminPassword,
        wardenUsername: form.wardenUsername.trim(),
        wardenPassword: form.wardenPassword,
      });

      toast.success("PG created successfully");
      navigate(`/owners/${ownerId}`);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
        toast.error("Backend API not available: POST /owners/{ownerId}/pgs");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to create PG");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4 sm:p-6 flex items-start justify-center">
      <Card className="w-full max-w-4xl overflow-hidden border-border shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-b border-border p-5 sm:p-6">
          <button
            type="button"
            onClick={goBack}
            className="absolute top-5 left-5 h-10 w-10 rounded-full border border-border bg-background/80 backdrop-blur flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="pl-14 flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
              <Building2 className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Create New PG
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create PG structure, admin account, and warden account.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6 space-y-5">
          <Section
            icon={<MapPin className="h-5 w-5" />}
            title="PG Details"
            description="This will create floors, rooms, and beds automatically."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="PG Name"
                value={form.pgName}
                onChange={(v) => set("pgName", v)}
                required
              />

              <Field
                label="Location"
                value={form.location}
                onChange={(v) => set("location", v)}
                required
              />

              <Field
                label="Total Floors"
                type="number"
                value={form.totalFloors}
                onChange={(v) => set("totalFloors", v)}
                min={1}
                required
              />

              <Field
                label="Rooms per Floor"
                type="number"
                value={form.roomsPerFloor}
                onChange={(v) => set("roomsPerFloor", v)}
                min={1}
                required
              />

              <Field
                label="Beds per Room"
                type="number"
                value={form.bedsPerRoom}
                onChange={(v) => set("bedsPerRoom", v)}
                min={1}
                required
              />

              <Field
                label="Monthly Rent"
                type="number"
                value={form.defaultRent}
                onChange={(v) => set("defaultRent", v)}
                min={1}
                required
              />
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section
              icon={<UserCog className="h-5 w-5" />}
              title="Admin Account"
              description="Admin login for managing PG operations."
            >
              <div className="space-y-4">
                <Field
                  label="Admin Username"
                  value={form.adminUsername}
                  onChange={(v) => set("adminUsername", v)}
                  required
                />

                <Field
                  label="Admin Password"
                  type="password"
                  value={form.adminPassword}
                  onChange={(v) => set("adminPassword", v)}
                  required
                />
              </div>
            </Section>

            <Section
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Warden Account"
              description="Warden login with limited permissions."
            >
              <div className="space-y-4">
                <Field
                  label="Warden Username"
                  value={form.wardenUsername}
                  onChange={(v) => set("wardenUsername", v)}
                  required
                />

                <Field
                  label="Warden Password"
                  type="password"
                  value={form.wardenPassword}
                  onChange={(v) => set("wardenPassword", v)}
                  required
                />
              </div>
            </Section>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={saving}
              className="w-full sm:w-40"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="w-full flex-1 shadow-md"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? "Creating PG..." : "Create New PG"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>

        <div>
          <h2 className="font-bold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  placeholder?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="relative">
        <Input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          required={required}
          min={min}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl pr-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
