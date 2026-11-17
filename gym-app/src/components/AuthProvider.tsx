"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api } from "@/lib/api";
import type { Profile } from "@/lib/apiTypes";
import { firebaseConfigured, getFirebaseAuth } from "@/lib/firebase";

type Status = "loading" | "anonymous" | "authenticated" | "unconfigured";

interface AuthValue {
  status: Status;
  firebaseUser: FirebaseUser | null;
  /** The MongoDB record: role, membership, etc. Null until loaded. */
  profile: Profile | null;
  isAdmin: boolean;
  /** Set when the API rejected a signed-in user (e.g. account disabled, server down). */
  problem: string;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Re-reads Firebase (e.g. after verifying the email) and the profile from the API. */
  refresh: () => Promise<void>;
  setName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(firebaseConfigured ? "loading" : "unconfigured");
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [problem, setProblem] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await api<Profile>("/me"));
      setProblem("");
      setStatus("authenticated");
    } catch (e) {
      setProfile(null);
      setProblem(e instanceof Error ? e.message : "Could not load your account");
      // A disabled account is signed out right away; a server outage keeps the Firebase session.
      if (e instanceof ApiError && (e.status === 403 || e.status === 401)) {
        await signOut(getFirebaseAuth());
        setStatus("anonymous");
      } else {
        setStatus("authenticated");
      }
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setStatus("anonymous");
        return;
      }
      void loadProfile();
    });
  }, [loadProfile]);

  const value = useMemo<AuthValue>(() => {
    const auth = () => getFirebaseAuth();
    return {
      status,
      firebaseUser,
      profile,
      isAdmin: profile?.role === "admin",
      problem,
      login: async (email, password) => {
        setProblem("");
        await signInWithEmailAndPassword(auth(), email, password);
      },
      register: async (name, email, password) => {
        setProblem("");
        const cred = await createUserWithEmailAndPassword(auth(), email, password);
        await updateProfile(cred.user, { displayName: name });
        await sendEmailVerification(cred.user).catch(() => undefined);
        await cred.user.getIdToken(true);
        await api("/me", { method: "PATCH", body: { name } }).catch(() => undefined);
        await loadProfile();
      },
      loginWithGoogle: async () => {
        setProblem("");
        await signInWithPopup(auth(), new GoogleAuthProvider());
      },
      resetPassword: (email) => sendPasswordResetEmail(auth(), email),
      resendVerification: async () => {
        const u = auth().currentUser;
        if (u) await sendEmailVerification(u);
      },
      refresh: async () => {
        const u = auth().currentUser;
        if (!u) return;
        await u.reload();
        await u.getIdToken(true);
        setFirebaseUser(auth().currentUser);
        await loadProfile();
      },
      setName: async (name) => {
        setProfile(await api<Profile>("/me", { method: "PATCH", body: { name } }));
      },
      logout: async () => {
        await signOut(auth());
      },
    };
  }, [status, firebaseUser, profile, problem, loadProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Friendly text for the most common Firebase errors. */
export function authErrorMessage(e: unknown): string {
  const code = typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Wrong email or password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/invalid-email":
      return "That email address does not look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in the Firebase console yet.";
    default:
      return e instanceof Error ? e.message : "Something went wrong";
  }
}
