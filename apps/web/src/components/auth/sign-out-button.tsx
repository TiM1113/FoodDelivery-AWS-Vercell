"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="cursor-pointer rounded-full border border-primary bg-transparent px-7 py-2.5 text-sm font-medium text-[#49557e] transition-colors hover:bg-accent"
    >
      Sign Out
    </button>
  );
}
