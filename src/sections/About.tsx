// @ts-nocheck
'use client';

import photo from '@/assets/images/rk.png';
import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC } from 'react';

// SVG path animation variants
const pathVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      duration: 2,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Decorative SVG component with animations
const DecorativeSVG: FC = () => (
  <>
    <motion.svg
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="absolute left-0 top-1/4 w-1/2 h-1/2 md:w-64 md:h-64"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
    >
      <motion.path
        d="M0 50C0 50 20 0 50 0C80 0 100 50 100 50"
        strokeWidth="0.5"
        variants={pathVariants}
        initial="hidden"
        animate="visible"
        className="text-white/20"
      />
      <motion.path
        d="M10 45C10 45 25 5 50 5C75 5 90 45 90 45"
        strokeWidth="0.5"
        variants={pathVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="text-white/10"
      />
    </motion.svg>
    <motion.svg
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="absolute right-0 bottom-0 w-1/2 h-1/2 md:w-96 md:h-96"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
    >
      <motion.path
        d="M100 50C100 50 80 100 50 100C20 100 0 50 0 50"
        strokeWidth="0.5"
        variants={pathVariants}
        initial="hidden"
        animate="visible"
        className="text-white/20"
      />
      <motion.path
        d="M90 55C90 55 75 95 50 95C25 95 10 55 10 55"
        strokeWidth="0.5"
        variants={pathVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="text-white/10"
      />
    </motion.svg>
  </>
);

const Test: FC = () => {
  return (
    <div className="min-h-screen lg:mt-40 relative overflow-hidden" id="intro">
      <DecorativeSVG />

      <div className="container mx-auto px-4 py-8 md:py-20 flex flex-col md:flex-row-reverse gap-8 md:gap-12 items-center relative z-10">
        {/* Text content column */}
        <div className="w-full md:w-1/2 space-y-6 md:space-y-8">
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-6xl lg:text-7xl font-serif"
            >
              Hi. I&apos;m
              <br />
              RK PAI
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Bio: same typography as the previous version (text-lg md:text-2xl,
                  space-y-4, continuation paragraphs hung-indented by ml-10 md:ml-12,
                  one phrase carrying the animated breathing underline) — just the
                  new copy split across three sentences for rhythm. */}
              <div className="text-lg md:text-2xl space-y-4">
                <p>
                  Nature is my greatest inspiration, and{' '}
                  <motion.span
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="italic underline underline-offset-4"
                  >
                    wildlife photography
                  </motion.span>{' '}
                  is my way of celebrating its beauty.
                </p>
                <p className="ml-10 md:ml-12">
                  Through my lens, I capture birds, wildlife, and moments from
                  nature that inspire peace, wonder, and conservation.
                </p>
                <p className="ml-10 md:ml-12">
                  Every photograph tells a story of patience, passion, and a
                  deep connection with the natural world.
                </p>
              </div>

              <blockquote className="relative mt-8 border-l-2 border-red-orange-500 pl-5 md:pl-6">
                <p className="font-playfair italic text-xl md:text-2xl leading-snug">
                  &ldquo;Every photograph is not just an image &mdash; it is a
                  silent conversation between nature and the soul.&rdquo;
                </p>
              </blockquote>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-start"
          >
            <Image
              src="/sig.png"
              alt="Signature"
              // sig.png is 300×150 (2:1); width/height must match that ratio or
              // Tailwind's `img { height: auto }` reset recomputes the height and
              // next/image warns about a broken aspect ratio.
              width={150}
              height={75}
              className="opacity-80"
            />
          </motion.div>
        </div>

        {/* Image column */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2"
        >
          <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
            <Image
              src="/rkk.jpeg"
              alt="Wildlife Photographer"
              fill
              // Image column is full-width on mobile, half-width from `md:` (768px) up.
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover fade-to-transparent"
              priority
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Test;
