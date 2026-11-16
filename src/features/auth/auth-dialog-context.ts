import { createContext, useContext } from "react";
import type { AuthMode } from "@/features/auth/auth-panel";

export type AuthDialogContextValue = {
  openAuth: (mode?: AuthMode, redirect?: string) => void;
  closeAuth: () => void;
};

export const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return context;
}
