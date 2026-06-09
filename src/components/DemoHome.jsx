import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function HomeDemo() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const demoSuperAdminLogin = () => {
    login({
      username: "owner",
      password: "owner123",
      role: "OWNER",
      pgId: 1,
    });

    navigate("/super-admin/pgs");
  };

  const demoAdminLogin = () => {
    login({
      username: "admin",
      password: "admin123",
      role: "ADMIN",
      pgId: 1,
    });

    navigate("/pg/1/dashboard");
  };

  const demoWardenLogin = () => {
    login({
      username: "warden",
      password: "warden123",
      role: "WARDEN",
      pgId: 1,
    });

    navigate("/pg/1/dashboard");
  };

  return (
    <div className="space-y-3 mt-4">
      <button
        type="button"
        onClick={demoSuperAdminLogin}
        style={{
          height: "46px",
          width: "100%",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          color: "black",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "white";
          e.currentTarget.style.backgroundColor = "#171717";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "black";
          e.currentTarget.style.backgroundColor = "#ffffff";
        }}
      >
        Demo Super Admin
      </button>

      <button
        type="button"
        onClick={demoSuperAdminLogin}
        style={{
          height: "46px",
          width: "100%",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          color: "black",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "white";
          e.currentTarget.style.backgroundColor = "#171717";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "black";
          e.currentTarget.style.backgroundColor = "#ffffff";
        }}
      >
        Demo Admin
      </button>
      <button
        type="button"
        onClick={demoSuperAdminLogin}
        style={{
          height: "46px",
          width: "100%",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          color: "black",
          fontSize: "14px",
          fontWeight: 600,
          boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "white";
          e.currentTarget.style.backgroundColor = "#171717";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "black";
          e.currentTarget.style.backgroundColor = "#ffffff";
        }}
      >
        Demo Warden
      </button>
    </div>
  );
}
