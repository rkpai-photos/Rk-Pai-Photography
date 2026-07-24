/* eslint-disable */
"use client";
import { FC, useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import bird from "@/assets/images/rkpai1.png";
import { motion, useAnimate, AnimatePresence } from "framer-motion";
import { ImageIcon } from "lucide-react";
import TransitionLink from "@/components/TransitionLink";
import { useStartPageTransition } from "@/components/page-transition";

const navItems = [
  {
    label: "About",
    href: "/#intro",
    isExternal: false,
  },
  {
    label: "Gallery",
    href: "/stories",
    isExternal: false,
  },
  {
    label: "Albums",
    href: "/album",
    isExternal: false,
  },
  {
    label: "Book",
    href: "/feather-fables",
    isExternal: false,
  },
  {
    label: "Recent Stories",
    href: "/#projects",
    isExternal: false,
  },
  {
    label: "Contact",
    href: "mailto:rkpaiin@gmail.com",
    isExternal: true,
  },
];

const Header: FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const startPageTransition = useStartPageTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [navScope, navAnimate] = useAnimate();

  // Handle menu animations
  useEffect(() => {
    const animateMenu = async () => {
      if (isOpen) {
        await navAnimate(
          navScope.current,
          { height: "100%", opacity: 1 },
          { duration: 0.6, ease: "easeInOut" },
        );
      } else {
        await navAnimate(
          navScope.current,
          { height: 0, opacity: 0 },
          { duration: 0.6, ease: "easeInOut" },
        );
      }
    };

    animateMenu();
  }, [isOpen, navAnimate, navScope]);

  // Handle navigation
  const handleNavigation = (href: string, isExternal: boolean) => {
    setIsOpen(false);

    // Protocol links (mailto:/tel:) and anything flagged external: hand off to the browser.
    if (isExternal || href.startsWith("mailto:") || href.startsWith("tel:")) {
      window.location.href = href;
      return;
    }

    // Home-page section anchors ("/#intro", "/#projects", …). This Header is
    // mounted on every public page now, not just "/", so the target element may
    // not exist on the current page — if we're already home, smooth-scroll to it;
    // otherwise navigate to "/#…" and let the browser scroll to the section.
    if (href.startsWith("/#")) {
      const elementId = href.slice(2);
      if (pathname === "/") {
        document
          .getElementById(elementId)
          ?.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.href = href;
      }
      return;
    }

    // Plain in-app routes ("/stories", "/album", …). Show the loader first so
    // it's already painted when the new route's data fetch / mount begins.
    startPageTransition(href);
    router.push(href);
  };

  const menuItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <motion.div
        className="fixed top-0 left-0 w-full h-0 overflow-hidden bg-stone-900"
        ref={navScope}
        initial={{ height: 0, opacity: 0 }}
      >
        <nav className="mt-28 flex flex-col">
          <AnimatePresence>
            {isOpen &&
              navItems.map(({ label, href, isExternal }, index) => (
                <motion.div
                  key={label}
                  custom={index}
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                  className="text-stone-200 border-t last:border-b border-stone-800 py-8 group/nav-item relative isolate cursor-pointer"
                  onClick={() => handleNavigation(href, isExternal)}
                >
                  <div className="container !max-w-full flex items-center justify-between">
                    <span className="text-3xl group-hover/nav-item:pl-4 transition-all duration-700">
                      {label}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      className="size-6 opacity-0 group-hover/nav-item:opacity-100 transition-opacity duration-700"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                      />
                    </svg>
                  </div>
                  <div className="absolute w-full h-0 bg-stone-800 group-hover/nav-item:h-full transition-all duration-700 bottom-0 -z-10" />
                </motion.div>
              ))}
          </AnimatePresence>
        </nav>
      </motion.div>

      <div
        className={`container !max-w-full backdrop-blur-lg transition-colors duration-700 ${isOpen ? "bg-stone-900/90" : "bg-transparent"}`}
      >
        <div className="flex justify-between h-28 items-center">
          <div className="relative z-50">
            <TransitionLink href="/">
              <Image
                src={bird}
                alt="Logo"
                width={200}
                height={100}
                priority
                className={`object-contain transition-all duration-700 transform hover:scale-110 md:!w-72 md:!h-36 lg:!w-96 lg:!h-48 lg:mr-0 lg:mt-5 ${
                  isOpen ? "invert brightness-0" : ""
                }`}
              />
            </TransitionLink>
          </div>

          <div className="flex items-center gap-4">
            <button
              className={`size-11 rounded-full inline-flex items-center justify-center relative z-50 transition-colors duration-700 ${
                isOpen
                  ? "bg-stone-200/10 hover:bg-stone-200/20"
                  : "bg-stone-200/50 hover:bg-stone-300/50"
              }`}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {/* Hamburger ⇄ X — two CSS-transformed bars. HTML elements rotate
                  around their own centre in every browser/build mode; an SVG
                  <line>'s transform-origin does not (it defaults to the SVG
                  view-box), which is why the old <motion.line> version didn't
                  form an X on the deployed site. */}
              <span className="relative block h-4 w-5">
                <span
                  className={`absolute left-0 top-[2px] block h-0.5 w-5 rounded-full transition-all duration-[400ms] ease-in-out ${
                    isOpen
                      ? "translate-y-[5px] rotate-45 bg-stone-200"
                      : "bg-stone-900"
                  }`}
                />
                <span
                  className={`absolute bottom-[2px] left-0 block h-0.5 w-5 rounded-full transition-all duration-[400ms] ease-in-out ${
                    isOpen
                      ? "-translate-y-[5px] -rotate-45 bg-stone-200"
                      : "bg-stone-900"
                  }`}
                />
              </span>
            </button>
            <button
              className={`hidden md:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium 
              transition-all duration-300 group 
              ${
                isOpen
                  ? "bg-stone-200 text-stone-900 hover:bg-stone-300"
                  : "bg-gray-900 text-white hover:bg-slate-900 backdrop-blur-sm"
              }`}
              onClick={() => handleNavigation("/stories", false)}
            >
              <ImageIcon
                className={`size-5 transition-transform duration-300 
                ${
                  isOpen
                    ? "text-stone-900 group-hover:rotate-12"
                    : "text-stone-200 group-hover:rotate-12"
                }`}
              />
              Gallery
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
