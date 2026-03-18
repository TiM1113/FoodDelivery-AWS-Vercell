import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-2xl font-bold">Tomato</p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Tomato Food Delivery. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
