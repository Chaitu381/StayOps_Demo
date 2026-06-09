import { useState } from "react";
import { X, Loader2, UserPlus, Sparkles, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const today = new Date().toISOString().slice(0, 10);

const empty = {
  ownerName: "",
  ownerUsername: "",
  ownerPassword: "",
  subscriptionPlan: "TRIAL",
  subscriptionActive: "true",
  subscriptionStartDate: today,
  subscriptionExpiryDate: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateOwnerModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  if (!open) return null;

  function set<K extends keyof typeof empty>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.ownerName.trim()) {
      toast.error("Owner name is required");
      return false;
    }

    if (!form.ownerUsername.trim()) {
      toast.error("Owner username is required");
      return false;
    }

    if (!form.ownerPassword.trim()) {
      toast.error("Owner password is required");
      return false;
    }

    if (!form.subscriptionStartDate) {
      toast.error("Start date is required");
      return false;
    }

    if (!form.subscriptionExpiryDate) {
      toast.error("Expiry date is required");
      return false;
    }

    return true;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!validate()) return;

    setSaving(true);

    try {
      await api.createOwner({
        ownerName: form.ownerName.trim(),
        ownerUsername: form.ownerUsername.trim(),
        ownerPassword: form.ownerPassword,
        subscriptionPlan: form.subscriptionPlan,
        subscriptionActive: form.subscriptionActive === "true",
        subscriptionStartDate: form.subscriptionStartDate,
        subscriptionExpiryDate: form.subscriptionExpiryDate,
      });

      toast.success("Owner created successfully");
      setForm(empty);
      setShowOwnerPassword(false);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to create owner"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 animate-in fade-in duration-200">
      <Card className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="relative border-b bg-gradient-to-r from-blue-50 via-white to-blue-50 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <UserPlus className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Add New Owner
              </h2>
              <p className="text-sm text-slate-500">
                Create owner account and configure subscription.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Owner Name"
              value={form.ownerName}
              onChange={(v) => set("ownerName", v)}
              required
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Subscription Plan</Label>

              <Select
                value={form.subscriptionPlan}
                onValueChange={(value) => set("subscriptionPlan", value)}
              >
                <SelectTrigger className="h-11 rounded-xl border-slate-200 transition-all hover:border-blue-400 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select Plan" />
                </SelectTrigger>

                <SelectContent className="rounded-xl">
                  <SelectItem value="TRIAL">🚀 Trial Plan</SelectItem>
                  <SelectItem value="MONTHLY">💼 Monthly Plan</SelectItem>
                  <SelectItem value="QUARTERLY">⭐ Quarterly Plan</SelectItem>
                  <SelectItem value="YEARLY">👑 Yearly Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Field
              label="Owner Username"
              value={form.ownerUsername}
              onChange={(v) => set("ownerUsername", v)}
              required
            />

            <div className="relative">
              <Field
                label="Owner Password"
                type={showOwnerPassword ? "text" : "password"}
                value={form.ownerPassword}
                onChange={(v) => set("ownerPassword", v)}
                required
              />

              <button
                type="button"
                onClick={() => setShowOwnerPassword((prev) => !prev)}
                className="absolute right-3 top-[45px] text-slate-500 transition hover:text-slate-700"
                aria-label={
                  showOwnerPassword ? "Hide owner password" : "Show owner password"
                }
              >
                {showOwnerPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <Field
              label="Subscription Start Date"
              type="date"
              value={form.subscriptionStartDate}
              onChange={(v) => set("subscriptionStartDate", v)}
              required
            />

            <Field
              label="Subscription Expiry Date"
              type="date"
              value={form.subscriptionExpiryDate}
              onChange={(v) => set("subscriptionExpiryDate", v)}
              required
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-4 transition-all hover:border-blue-300 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Subscription Status
                </Label>
                <p className="mt-1 text-xs text-slate-500">
                  Owner access control
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    form.subscriptionActive === "true"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {form.subscriptionActive === "true" ? "Active" : "Inactive"}
                </span>

                <Switch
                  checked={form.subscriptionActive === "true"}
                  onCheckedChange={(checked) =>
                    set("subscriptionActive", String(checked))
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Owner will be able to login using this username and password.
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving} className="min-w-36">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Owner
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>

      <Input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border-slate-200 transition-all hover:border-blue-400 focus-visible:ring-blue-500/20"
      />
    </div>
  );
}
