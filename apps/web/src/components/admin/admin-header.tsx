import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export async function AdminHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Tomato"
              width={120}
              height={32}
              priority
            />
          </Link>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <span className="text-sm font-medium">
            {session?.user?.name}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
