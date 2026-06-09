import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { clearSelectedPgId, setSelectedPgId } from "@/lib/api";

export default function HomeDemo() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const demoOwnerLogin = () => {
    clearSelectedPgId();

    login({
      username: "owner",
      password: "owner123",
      role: "OWNER",
      ownerId: 1,
    });

    navigate("/owner/pgs", { replace: true });
  };

  const demoAdminLogin = () => {
    setSelectedPgId(1);

    login({
      username: "admin",
      password: "admin123",
      role: "ADMIN",
      pgId: 1,
    });

    navigate("/pg/1/dashboard", { replace: true });
  };

  const demoWardenLogin = () => {
    setSelectedPgId(1);

    login({
      username: "warden",
      password: "warden123",
      role: "WARDEN",
      pgId: 1,
    });

    navigate("/pg/1/dashboard", { replace: true });
  };

  const buttonStyle = {
    height: "46px",
    width: "100%",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    color: "black",
    fontSize: "14px",
    fontWeight: 600,
    boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
    transition: "all 0.2s ease",
  };

  return (
    <div className="space-y-3 mt-4">
      <button type="button" onClick={demoOwnerLogin} style={buttonStyle}>
        Demo Owner
      </button>

      <button type="button" onClick={demoAdminLogin} style={buttonStyle}>
        Demo Admin
      </button>

      <button type="button" onClick={demoWardenLogin} style={buttonStyle}>
        Demo Warden
      </button>
    </div>
  );
}
