"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/m3/core";
import { TextField } from "@/components/m3/inputs";
import { signUp } from "@/lib/auth-client";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await signUp.email({ name, email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Could not create your account.");
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="auth-wrap">
      <div className="card card-high auth-card">
        <div className="auth-logo">
          <span className="appbar-dot" aria-hidden="true" />
          Daily Line
        </div>
        <h1>Create your account</h1>
        <p className="sub">Your routine, everywhere you sign in. We&apos;ll start you off with the Daily Line template.</p>
        <form onSubmit={submit}>
          {error ? (
            <p className="auth-err" role="alert">
              <Icon name="error" />
              {error}
            </p>
          ) : null}
          <TextField label="Name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
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
            autoComplete="new-password"
            required
            minLength={8}
            support="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
        <p className="auth-alt">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
