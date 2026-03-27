import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { SignInLink } from "@/components/auth/sign-in-link";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartBadge } from "@/components/cart-badge";

export async function Navbar() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-[80%] items-center justify-between">
        <Link href="/">
          <Image src="/images/logo.png" alt="Tomato" width={150} height={40} style={{ width: "auto", height: "auto" }} priority />
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
          <CartBadge />
          {session?.user ? (
            <UserMenu
              name={session.user.name ?? ""}
              isAdmin={role === "admin"}
            />
          ) : (
            <SignInLink />
          )}
        </div>
      </div>
    </nav>
  );
}
