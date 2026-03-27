import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 bg-[#323232] px-[8vw] pt-20 text-[#d9d9d9]">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr_1fr] md:gap-20">
        <div className="flex flex-col items-start gap-5">
          <h2 className="text-2xl font-semibold text-white">Tomato</h2>
          <p className="text-sm leading-relaxed">
            Tomato is your go-to food delivery platform. We bring the best restaurants in your city
            right to your doorstep, fast and fresh.
          </p>
          <div className="flex gap-4">
            <a
              href="https://www.facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#808080] transition-colors hover:border-white hover:text-white"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#808080] transition-colors hover:border-white hover:text-white"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#808080] transition-colors hover:border-white hover:text-white"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-start gap-5">
          <h2 className="text-xl font-semibold text-white">Company</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>
              <Link href="/" className="transition-colors hover:text-white">Home</Link>
            </li>
            <li>
              <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-start gap-5">
          <h2 className="text-xl font-semibold text-white">Get in Touch</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li>+61-000-000-0000</li>
            <li>contact@tomato.com</li>
          </ul>
        </div>
      </div>

      <hr className="my-5 border-[#808080]" />
      <p className="pb-5 text-center text-sm">
        © {new Date().getFullYear()} Tomato Food Delivery. All rights reserved.
      </p>
    </footer>
  );
}
