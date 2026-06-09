import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

import {
  AuthCreds,
  clearAuth,
  clearSelectedPgId,
  loadAuth,
  saveAuth,
} from "@/lib/api";

export type Role = AuthCreds["role"];

interface AuthContextValue {
  creds: AuthCreds | null;
  login: (creds: AuthCreds) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [creds, setCreds] = useState<AuthCreds | null>(() => loadAuth());

  const value = useMemo<AuthContextValue>(
    () => ({
      creds,

      login: (newCreds: AuthCreds) => {
        saveAuth(newCreds);
        setCreds(newCreds);
      },

      logout: () => {
        clearAuth();
        clearSelectedPgId();
        setCreds(null);
      },
    }),
    [creds]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
