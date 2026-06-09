import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { AuthCreds, clearAuth, clearSelectedPgId, loadAuth, saveAuth } from "@/lib/api";

export type Role = AuthCreds["role"];

interface AuthContextValue {
  creds: AuthCreds | null;
  login: (creds: AuthCreds) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [creds, setCreds] = useState<AuthCreds | null>(null);

  useEffect(() => {
    setCreds(loadAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      creds,
      login: (c) => {
        saveAuth(c);
        setCreds(c);
      },
      logout: () => {
        clearAuth();
        clearSelectedPgId();
        setCreds(null);
      },
    }),
    [creds],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
