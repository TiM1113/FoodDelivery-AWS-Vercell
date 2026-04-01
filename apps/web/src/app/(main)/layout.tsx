import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CartInitializer } from "@/components/cart-initializer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CartInitializer />
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </>
  );
}
