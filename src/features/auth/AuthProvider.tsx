import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { api } from "../../platform/runtime";
import { ApiFailure, profile as readProfile } from "../../api/types";
import type { Profile } from "../../api/types";
import { clearExportFiles } from "../../platform/exports";

type AuthState = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signingOut: boolean;
  retrySignOut: boolean;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(api.configured);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [retrySignOut, setRetrySignOut] = useState(false);
  const reload = useCallback(async () => {
    const revision = api.session.revision();
    try {
      const user = readProfile(await api.request("/v1/me"));
      if (revision === api.session.revision()) {
        setProfile(user);
        setError(null);
      }
    } catch (failure) {
      if (revision === api.session.revision() || !api.session.snapshot()) {
        if (
          !api.session.snapshot() ||
          (failure instanceof ApiFailure && failure.status === 401)
        )
          setProfile(null);
        setError(
          failure instanceof Error ? failure.message : "Please sign in again.",
        );
      }
      throw failure;
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    void Promise.resolve()
      .then(clearExportFiles)
      .catch(() => {
        if (mounted)
          setError(
            "Temporary export files could not be removed from this device.",
          );
      });
    if (!api.configured) return;
    void api
      .request("/v1/me")
      .then((value) => {
        const user = readProfile(value);
        if (mounted) setProfile(user);
      })
      .catch((failure) => {
        if (mounted)
          setError(
            failure instanceof Error
              ? failure.message
              : "Please sign in again.",
          );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [reload]);
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active" && api.session.snapshot())
        void reload().catch(() => {});
    });
    return () => listener.remove();
  }, [reload]);
  const signOut = useCallback(async () => {
    setSigningOut(true);
    setProfile(null);
    try {
      const [session, files] = await Promise.allSettled([
        api.logout(),
        Promise.resolve().then(clearExportFiles),
      ]);
      if (session.status === "rejected") throw session.reason;
      if (files.status === "rejected")
        throw new Error(
          "Signed out, but temporary export files could not be removed. Please retry sign-out.",
        );
      setError(null);
      setRetrySignOut(false);
    } catch (failure) {
      setRetrySignOut(true);
      setError(
        failure instanceof Error
          ? failure.message
          : "Sign-out could not be confirmed. Please retry.",
      );
    } finally {
      setSigningOut(false);
    }
  }, []);
  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        error,
        reload,
        signOut,
        signingOut,
        retrySignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error("AuthProvider is missing");
  return state;
}
