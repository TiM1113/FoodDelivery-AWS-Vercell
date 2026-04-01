"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:rounded-full md:border md:border-primary md:bg-transparent md:px-7 md:py-2.5 md:hover:bg-accent"
    >
      <LogOut className="h-4 w-4 md:hidden" />
      <span>Sign Out</span>
    </button>
  );
}
