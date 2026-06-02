"use client";
import { WordPullUp } from "@/components/ui/word-pull-up";
import { FC, useEffect, useRef } from "react";
import Image from "next/image";
import Button from "@/components/Button";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const Hero: FC = () => {
  const imageRef = useRef<HTMLDivElement>(null);
  const scrollingDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Desktop only: the image-grow scrub needs the 100vh spacer below to drive
    // it. On mobile the image is locked to full width (max-md:!w-full) and the
    // spacer collapses (md:h-[100vh]), so there's nothing to animate — gating
    // with matchMedia avoids attaching a ScrollTrigger to a 0-height trigger and
    // cleans the animation up automatically when crossing the breakpoint.
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      if (!imageRef.current || !scrollingDivRef.current) return;
      gsap.to(imageRef.current, {
        width: "240%",
        ease: "none",
        scrollTrigger: {
          trigger: scrollingDivRef.current,
          start: "top bottom",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section>
      <div className="grid md:grid-cols-12 md:h-screen items-stretch sticky top-0">
        <div className="md:col-span-7 flex flex-col justify-center">
          <div className="container !max-w-full">
            <motion.h1
              className="text-5xl md:text-6xl mt-40 l:text-7xl md:mt-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <WordPullUp>
                Creating visual stories that connect people with the beauty of
                birds
              </WordPullUp>
            </motion.h1>
            <div className="flex flex-col md:flex-row md:items-center mt-10 items-start gap-6">
              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.75 }}
              >
                <Button
                  variant="secondary"
                  iconAfter={
                    <div className="overflow-hidden size-5">
                      <div className="h-5 w-10 flex group-hover/button:-translate-x-1/2 transition-transform duration-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5"
                          />
                        </svg>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 5.25 7.5 7.5 7.5-7.5m-15 6 7.5 7.5 7.5-7.5"
                          />
                        </svg>
                      </div>
                    </div>
                  }
                  onClick={() => {
                    const target = document.querySelector("#projects");
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                >
                  <span>View My Stories</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="md:col-span-5 relative mt-28 ">
          <div
            ref={imageRef}
            className="mt-20 md:mt-0 md:size-full md:absolute md:right-0 max-md:!w-full "
          >
            <Image
              src="/b.jpeg"
              alt="bird"
              width={1600}
              height={1228}
              className="size-full object-cover "
            />
          </div>
        </div>
      </div>
      <div className="md:h-[100vh]" ref={scrollingDivRef}></div>
    </section>
  );
};

export default Hero;
