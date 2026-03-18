import Image from "next/image";

export default function Home() {
  return (
    <div className="mx-auto w-[80%]">
      {/* Hero Section */}
      <div className="relative my-5 h-[34vw] min-h-[200px] overflow-hidden rounded-2xl">
        <Image
          src="/images/hero.png"
          alt="Order your favourite food here"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute bottom-[10%] left-[6vw] flex max-w-[50%] flex-col items-start gap-[1.5vw]">
          <h1 className="text-[max(4.5vw,22px)] font-medium leading-tight text-white">
            Order your favourite food here
          </h1>
          <p className="hidden text-[1vw] text-white md:block">
            Choose from a diverse menu featuring a delectable array of dishes crafted with the
            finest ingredients and culinary expertise.
          </p>
          <a
            href="#menu"
            className="rounded-full bg-white px-[2.3vw] py-[1vw] text-[max(1vw,13px)] font-medium text-[#747474] transition-colors hover:bg-gray-100"
          >
            View Menu
          </a>
        </div>
      </div>
    </div>
  );
}
