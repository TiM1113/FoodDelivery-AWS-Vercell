import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Tomato
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-foreground/80 hover:text-foreground transition-colors">
            Menu
          </Link>
          <Link href="/myorders" className="text-foreground/80 hover:text-foreground transition-colors">
            My Orders
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cart" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {session?.user ? (
            <>
              <span className="text-sm font-medium">{session.user.name}</span>
              <SignOutButton />
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
