"use client";
import { FC, MouseEvent, useEffect, useRef } from "react";
import { useAnimate, useInView, stagger } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

import Button from "@/components/Button";
import { useStartPageTransition } from "@/components/page-transition";

// Custom hook for text reveal animation
const useTextRevealAnimation = () => {
  const [scope, animate] = useAnimate();

  const entranceAnimation = async () => {
    await animate([
      [
        "h2",
        {
          opacity: [0, 1],
          y: [20, 0],
        },
        {
          duration: 0.8,
          ease: "easeOut",
        },
      ],
      [
        "span",
        {
          opacity: [0, 1],
          x: [-20, 0],
        },
        {
          duration: 0.5,
          ease: "easeOut",
        },
      ],
      [
        "a",
        {
          opacity: [0, 1],
          y: [10, 0],
        },
        {
          duration: 0.3,
          delay: stagger(0.1),
          ease: "easeOut",
        },
      ],
    ]);
  };

  return { scope, entranceAnimation };
};

const Footer: FC = () => {
  const { scope, entranceAnimation } = useTextRevealAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const router = useRouter();
  const pathname = usePathname();
  const startPageTransition = useStartPageTransition();

  useEffect(() => {
    if (inView) {
      entranceAnimation();
    }
  }, [inView, entranceAnimation]);

  // Mirrors Header.tsx: plain in-app routes go through the page-transition
  // loader, "/#…" hash anchors smooth-scroll when already on / and hard-nav
  // otherwise (so "Recent Stories" actually works from /stories or /album,
  // which was broken when the href was a fragment-only "#projects").
  const handleNavigation = (
    href: string,
    e: MouseEvent<HTMLAnchorElement>,
  ) => {
    // Let the browser handle modifier-clicks (new tab, etc.).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.button !== 0) return;

    e.preventDefault();

    if (href.startsWith("/#")) {
      const elementId = href.slice(2);
      if (pathname === "/") {
        document
          .getElementById(elementId)
          ?.scrollIntoView({ behavior: "smooth" });
      } else {
        // `.assign` is functionally identical to setting `.href`, but it's a
        // method call rather than a property assignment, so it doesn't trip
        // react-hooks/immutability (Header.tsx avoids this via its blanket
        // /* eslint-disable */).
        window.location.assign(href);
      }
      return;
    }

    startPageTransition(href);
    router.push(href);
  };

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/album", label: "Album" },
    { href: "/stories", label: "Gallery" },
    { href: "/feather-fables", label: "Book" },
    { href: "/#projects", label: "Recent Stories" },
  ];

  return (
    <footer className="bg-stone-900 text-white pt-10">
      <div className="container">
        <div className="section" ref={scope}>
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="uppercase">Chasing moments, capturing life.</span>
          </div>
          <div className="grid md:grid-cols-3 md:items-center">
            <div className="md:col-span-2">
              <h2 className="text-4xl mt-8 font-extralight md:text-7xl lg:text-8xl">
                Capturing the soul of the wild, one frame at a time
              </h2>
              <a href="mailto:rkpaiin@gmail.com">
                <Button
                  variant="secondary"
                  className="mt-8 group/button relative"
                  iconAfter={
                    <div className="size-6 overflow-hidden">
                      <div className="flex items-center transition-transform duration-300 group-hover/button:translate-x-6">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6 shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6 shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                          />
                        </svg>
                      </div>
                    </div>
                  }
                >
                  rkpaiin@gmail.com
                </Button>
              </a>
            </div>
            <div>
              <nav className="flex flex-col md:items-end gap-8 mt-16 md:mt-0">
                {navItems.map(({ href, label }) => (
                  <a
                    href={href}
                    key={label}
                    onClick={(e) => handleNavigation(href, e)}
                  >
                    <Button variant="text" className="text-lg group/nav">
                      <span className="relative">
                        {label}
                        <span className="absolute left-0 right-0 bottom-0 h-px bg-white scale-x-0 transition-transform duration-300 group-hover/nav:scale-x-100"></span>
                      </span>
                    </Button>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <p className="py-16 text-white/30 text-sm">
          Copyright &copy; RK Pai &bull; All rights reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
