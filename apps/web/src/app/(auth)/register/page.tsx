import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create account — Tomato" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
