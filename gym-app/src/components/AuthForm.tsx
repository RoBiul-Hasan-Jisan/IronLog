"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { authErrorMessage, useAuth } from "./AuthProvider";
import { SetupNotice } from "./SetupNotice";

function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get("next") ?? "/train";
  // Only same-site paths, so a crafted link cannot send people elsewhere after login.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/train";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { status, login, register, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace(nextPath());
  }, [status, router]);

  if (status === "unconfigured") return <SetupNotice />;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn();
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => (mode === "login" ? login(email, password) : register(name.trim(), email, password)));
  };

  const forgot = () => {
    if (!email) return setError("Type your email above first.");
    void run(async () => {
      await resetPassword(email);
      setInfo("If an account exists for that email, a reset link is on its way.");
    });
  };

  return (
    <div className="auth">
      <h1 className="page-title">{mode === "login" ? "Sign in" : "Create your account"}</h1>
      <form className="form" onSubmit={submit}>
        {mode === "register" && (
          <label className="form-field">
            Name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" />
          </label>
        )}
        <label className="form-field">
          Email
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="form-field">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {info && <p className="form-info" role="status">{info}</p>}
        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="btn btn--secondary btn--lg btn--block" disabled={busy} onClick={() => void run(loginWithGoogle)}>
          Continue with Google
        </button>
        {mode === "login" && (
          <button type="button" className="btn btn--quiet btn--block" onClick={forgot} disabled={busy}>
            Forgot password?
          </button>
        )}
      </form>
      <p className="auth-alt">
        {mode === "login" ? (
          <>
            New here? <Link href="/register">Create an account</Link>
          </>
        ) : (
          <>
            Already have an account? <Link href="/login">Sign in</Link>
          </>
        )}
      </p>
    </div>
  );
}
