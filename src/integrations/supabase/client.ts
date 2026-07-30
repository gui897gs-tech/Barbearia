import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const authCallbackStorageKey = "kings-barber-auth-callback";

export type AuthCallbackContext = {
  type: "invite" | "recovery";
  userId?: string;
};

captureAuthCallback();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function getAuthCallbackContext(): AuthCallbackContext | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.sessionStorage.getItem(authCallbackStorageKey);
    return stored ? (JSON.parse(stored) as AuthCallbackContext) : null;
  } catch {
    return null;
  }
}

export function clearAuthCallbackContext() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(authCallbackStorageKey);
  }
}

function captureAuthCallback() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.hash.slice(1));
  const type = params.get("type");
  if (type !== "invite" && type !== "recovery") return;

  const accessToken = params.get("access_token");
  const context: AuthCallbackContext = {
    type,
    userId: accessToken ? readJwtSubject(accessToken) : undefined,
  };
  window.sessionStorage.setItem(authCallbackStorageKey, JSON.stringify(context));
}

function readJwtSubject(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(window.atob(normalized)) as { sub?: string };
    return decoded.sub;
  } catch {
    return undefined;
  }
}
