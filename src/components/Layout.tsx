import { ReactNode } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  BedSingle,
  UtensilsCrossed,
  HardHat,
  Receipt,
  Settings2,
  LogOut,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";

import { useAuth, Role } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Users;
  roles: Role[];
}

function buildNav(pgId: string | undefined): NavItem[] {
  const base = pgId ? `/pg/${pgId}` : "";

  return [
    {
      to: pgId ? `${base}/dashboard` : "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "ADMIN", "WARDEN"],
    },
    {
      to: `${base}/students`,
      label: "Students",
      icon: Users,
      roles: ["SUPER_ADMIN", "ADMIN", "WARDEN"],
    },
    {
      to: `${base}/rooms`,
      label: "Rooms",
      icon: DoorOpen,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      to: `${base}/beds`,
      label: "Beds",
      icon: BedSingle,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      to: `${base}/beds/available`,
      label: "Available Beds",
      icon: CheckCircle2,
      roles: ["SUPER_ADMIN", "ADMIN", "WARDEN"],
    },
    {
      to: `${base}/monthly-status`,
      label: "Monthly Status",
      icon: Receipt,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      to: `${base}/workers`,
      label: "Workers",
      icon: HardHat,
      roles: ["SUPER_ADMIN", "ADMIN", "WARDEN"],
    },
    {
      to: `${base}/menu`,
      label: "Menu",
      icon: UtensilsCrossed,
      roles: ["SUPER_ADMIN", "ADMIN", "WARDEN"],
    },
    {
      to: `${base}/setup`,
      label: "Room Setup",
      icon: Settings2,
      roles: ["SUPER_ADMIN"],
    },
  ];
}

export default function Layout({ children }: { children: ReactNode }) {
  const { creds, logout } = useAuth();
  const navigate = useNavigate();
  const { pgId } = useParams();

  const role = creds?.role;
  const nav = buildNav(pgId).filter((item) => role && item.roles.includes(role));

  function goDashboard() {
    if (pgId) {
      navigate(`/pg/${pgId}/dashboard`);
      return;
    }

    if (role === "SUPER_ADMIN") {
      navigate("/super-admin/pgs");
      return;
    }

    navigate("/");
  }

  function logoutUser() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border">
          <div className="h-8 w-8 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">
            F
          </div>

          <div>
            <p className="text-sm font-semibold leading-tight">Fengari</p>
            <p className="text-[11px] text-muted-foreground">PG Manager</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mb-2"
            onClick={goDashboard}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={logoutUser}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card">
          <div>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold">
              {creds?.username}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                ({creds?.role})
              </span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={logoutUser}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}