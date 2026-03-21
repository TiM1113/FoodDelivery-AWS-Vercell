import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { auth } from "@/auth";
import { SignInLink } from "@/components/auth/sign-in-link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-[80%] items-center justify-between">
        <Link href="/">
          <Image src="/images/logo.png" alt="Tomato" width={150} height={40} priority />
        </Link>

        <div className="hidden md:flex items-center gap-5 text-lg font-medium">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Menu
          </Link>
          <Link href="/myorders" className="text-muted-foreground hover:text-foreground transition-colors">
            My Orders
          </Link>
        </div>

        <div className="flex items-center gap-8">
          <ThemeToggle />
          <Link href="/cart" aria-label="Cart" className="relative">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {session?.user ? (
            <>
              <span className="text-sm font-medium">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <SignInLink />
          )}
        </div>
      </div>
    </nav>
  );
}
