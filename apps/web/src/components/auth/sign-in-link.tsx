"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function SignInLink() {
  return (
    <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
      Sign In
    </Link>
  );
}
