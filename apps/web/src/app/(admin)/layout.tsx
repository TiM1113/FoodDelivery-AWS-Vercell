import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export const metadata = { title: "Admin — Tomato" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to access the admin panel.
        </p>
        <Link href="/" className="text-primary underline">
          Go back to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AdminHeader />
      <div className="flex flex-1 pt-14">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <AdminMobileNav />
    </div>
  );
}
