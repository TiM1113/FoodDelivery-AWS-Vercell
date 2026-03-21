"use client";

import Link from "next/link";

export function SignInLink() {
  return (
    <Link
      href="/login"
      className="rounded-full border border-primary bg-transparent px-7 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
    >
      Sign In
    </Link>
  );
}
