"use client";

import Link from "next/link";
import { User } from "lucide-react";

export function SignInLink() {
  return (
    <Link
      href="/login"
      className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:rounded-full md:border md:border-primary md:bg-transparent md:px-7 md:py-2.5 md:hover:bg-accent"
    >
      <User className="h-4 w-4 md:hidden" />
      <span>Sign In</span>
    </Link>
  );
}
