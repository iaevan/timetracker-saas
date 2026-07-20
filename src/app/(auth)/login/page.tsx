import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
