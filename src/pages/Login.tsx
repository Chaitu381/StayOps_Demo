import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Loader2,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import HomeDemo from "@/components/DemoHome";

import { useAuth, Role } from "@/context/AuthContext";
import { ApiError, api, AuthCreds, setSelectedPgId } from "@/lib/api";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState<Role>("SUPER_ADMIN");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setError("Username and password are required");
      return;
    }

    const creds: AuthCreds = {
      username: cleanUsername,
      password,
      role,
    };

    setLoading(true);

    try {
      const auth = await api.verify(creds);

      const backendRole = auth.role;
      const backendPgId = auth.pgId;

      login({
        username: cleanUsername,
        password,
        role: backendRole,
      });

      toast.success(`Welcome, ${auth.username}`);

      if (backendRole === "SUPER_ADMIN") {
        navigate("/super-admin/pgs", { replace: true });
        return;
      }

      if (backendRole === "OWNER") {
        if (backendPgId) setSelectedPgId(backendPgId);
        navigate("/owner/pgs", { replace: true });
        return;
      }

      if (!backendPgId) {
        setError("This user is not linked to any PG");
        return;
      }

      setSelectedPgId(backendPgId);

      navigate(`/pg/${backendPgId}/dashboard`, {
        replace: true,
      });
    } catch (err) {
      console.error("Login failed:", err);

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Invalid username or password");
        } else if (err.status === 403) {
          setError("You do not have permission to login with this role");
        } else if (err.status === 0) {
          setError("Backend is not reachable. Check if Spring Boot is running.");
        } else {
          setError(err.message || "Login failed");
        }
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#05070a] p-5 overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-1/2 top-[-160px] h-[330px] w-[620px] -translate-x-1/2 rounded-full bg-white/[0.055] blur-3xl" />
        <div className="absolute bottom-[-200px] left-1/2 h-[330px] w-[680px] -translate-x-1/2 rounded-full bg-white/[0.045] blur-3xl" />
      </div>

      <Card className="relative grid min-h-[480px] w-full max-w-[1080px] overflow-hidden rounded-[26px] border border-white/20 bg-white p-0 shadow-[0_35px_130px_rgba(255,255,255,0.08)] md:grid-cols-[1fr_0.85fr]">
        <div className="relative hidden overflow-hidden bg-black text-white md:block">
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-72"
            style={{
              backgroundImage: "url('/Fengari.png')",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/20 to-black/82" />

          <div className="relative z-10 flex h-full flex-col justify-between p-6">
            <div>
              <div className="mb-8 flex items-center gap-4">
                <div className="grid h-[48px] w-[48px] place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md">
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-[26px] font-bold tracking-tight">
                    StayOps
                  </h1>
                  <p className="mt-0.5 text-sm text-white/65">
                    Hostel/PG Manager
                  </p>
                </div>
              </div>

              {/* <h2 className="text-[32px] font-bold leading-[1.12] tracking-tight">
                Manage Better.
                <br />
                Stay Ahead.
              </h2> */}

              <div className="my-5 h-[2px] w-20 rounded-full bg-white/45 shadow-[0_0_18px_rgba(255,255,255,0.45)]" />

              {/* <p className="max-w-[420px] text-sm leading-7 text-white/80">
                Streamline your hostel operations and deliver a premium living
                experience with centralized management.
              </p> */}
            </div>

            <div className="w-full max-w-[620px] rounded-[28px] border border-white/15 bg-black/30 px-5 py-3 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                  <ShieldCheck className="h-5 w-5 text-white/90" />
                </div>
            
                <p className="text-sm leading-7 text-white/75">
                  Built for PG owners, admins, and wardens to manage rooms,
                  students, payments, and operations cleanly.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-full items-center justify-center overflow-y-auto bg-white px-5 py-6 sm:px-7 md:px-7">
          <div className="w-full max-w-[320px]">
            <div className="mb-6 md:hidden">
              <div className="flex items-center gap-4">
                <div className="grid h-[48px] w-[48px] place-items-center rounded-2xl bg-black text-white shadow-lg">
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-950">
                    StayOps
                  </h1>
                  <p className="text-sm text-slate-500">Hostel/PG Manager</p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h2 className="text-[30px] font-bold tracking-tight text-slate-950">
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Sign in to continue to StayOps
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-semibold">
                  Username
                </Label>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter username"
                    required
                    className="h-[44px] rounded-2xl border-slate-200 bg-white pl-11 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-black"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-semibold">
                  Password
                </Label>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                    className="h-[44px] rounded-2xl border-slate-200 bg-white pl-11 pr-11 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-black"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4.5 w-4.5" />
                    ) : (
                      <Eye className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 accent-black"
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  className="font-semibold text-slate-950 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-[46px] w-full rounded-2xl bg-black text-sm font-semibold text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] hover:bg-neutral-900"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-3 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="pt-1 text-center text-xs text-slate-500">
                New here?{" "}
                <span className="font-semibold text-black">
                  Contact your administrator
                </span>
              </p>
              <HomeDemo/>
            </form>
          </div>
        </div>
      </Card>
    </div>
  );
}
