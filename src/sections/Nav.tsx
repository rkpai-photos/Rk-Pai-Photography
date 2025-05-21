"use client";
import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeIcon } from "lucide-react";
import bird from "@/assets/images/rkpai1.png";

const Header: FC = () => {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-transparent">
      <div className="container !max-w-full">
        <div className="flex justify-between h-28 items-center">
          <div className="relative z-50">
            <Link href="/">
              <Image
                src={bird}
                alt="Logo"
                width={200}
                height={100}
                priority
                className="object-contain transition-all duration-700 transform hover:scale-110 md:!w-72 md:!h-36 lg:!w-96 lg:!h-48 lg:mr-0 lg:mt-5"
              />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium 
              bg-gray-900 text-white hover:bg-slate-900 backdrop-blur-sm
              transition-all duration-300 group"
              onClick={() => router.push("/")}
            >
              <HomeIcon className="size-5 text-stone-200 transition-transform duration-300 group-hover:rotate-12" />
              Home
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
