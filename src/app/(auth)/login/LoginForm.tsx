"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Icon } from "@/components/m3/core";
import { TextField } from "@/components/m3/inputs";
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signIn.email({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message === "Invalid email or password" ? "Wrong email or password." : (error.message ?? "Could not sign in."));
      return;
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  };

  return (
    <div className="card card-high auth-card">
      <div className="auth-logo">
        <span className="appbar-dot" aria-hidden="true" />
        Daily Line
      </div>
      <h1>Welcome back</h1>
      <p className="sub">Sign in to see your day.</p>
      <form onSubmit={submit}>
        {error ? (
          <p className="auth-err" role="alert">
            <Icon name="error" />
            {error}
          </p>
        ) : null}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" size="lg" block disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="auth-alt">
        New here? <Link href="/signup">Create an account</Link>
      </p>
    </div>
  );
}
