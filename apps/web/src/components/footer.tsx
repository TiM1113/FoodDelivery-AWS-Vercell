import Image from "next/image";

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
            <Image src="/images/social/facebook.png" alt="Facebook" width={40} height={40} />
            <Image src="/images/social/twitter.png" alt="Twitter" width={40} height={40} />
            <Image src="/images/social/linkedin.png" alt="LinkedIn" width={40} height={40} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-5">
          <h2 className="text-xl font-semibold text-white">Company</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            <li className="cursor-pointer transition-colors hover:text-white">Home</li>
            <li className="cursor-pointer transition-colors hover:text-white">About Us</li>
            <li className="cursor-pointer transition-colors hover:text-white">Delivery</li>
            <li className="cursor-pointer transition-colors hover:text-white">Privacy Policy</li>
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
