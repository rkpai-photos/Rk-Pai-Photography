"use client";
import { MorphingText } from "@/components/ui/morphing-text";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const texts = ["Vision", "Lens", "Capture", "Focus", "Essence", "Glimpse"];
const PortfolioGrid = () => {
  const portfolioData = [
    {
      id: 1,
      images: ["/images/bird1.jpg", "/images/bird2.jpg", "/images/bird3.jpg"],
      height: 600,
      position: "up",
      title: "Woodland Wonders",
      description: "Capturing avian life in forest settings",
    },
    {
      id: 2,
      images: ["/images/bird4.jpg", "/images/bird5.jpg", "/images/bird6.jpg"],
      height: 600,
      position: "down",
      title: "Wetland Residents",
      description: "Intimate moments of water-dwelling birds",
    },
    {
      id: 3,
      images: ["/images/bird7.jpg", "/images/bird8.jpg", "/images/bird9.jpg"],
      height: 600,
      position: "up",
      title: "Migratory Journeys",
      description: "Birds in flight across vast landscapes",
    },
    {
      id: 4,
      images: [
        "/images/bird12.jpg",
        "/images/bird11.jpg",
        "/images/bird10.jpg",
      ],
      height: 600,
      position: "down",
      title: "Urban Dwellers",
      description: "Birds adapting to city environments",
    },
  ];

  const [currentIndices, setCurrentIndices] = useState(
    Array(portfolioData.length).fill(0),
  );

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const intervals = portfolioData.map(() =>
      setInterval(
        () => {
          setCurrentIndices((prevIndices) =>
            prevIndices.map((index, i) => {
              const randomChance = Math.random() > 0.5;
              return randomChance
                ? (index + 1) % portfolioData[i].images.length
                : index;
            }),
          );
        },
        Math.random() * 2000 + 3000,
      ),
    );

    return () => {
      window.removeEventListener("resize", handleResize);
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen pt-20 p-4 md:p-8 bg-transparent">
      {/* Simplified SVG Background */}

      <div className="relative z-10 max-w-[1600px] mx-auto">
        <h1 className="text-4xl mt-5 md:text-6xl  text-center text-slate-900 mb-16 tracking-tight">
          <MorphingText texts={texts} />
        </h1>

        <div
          className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-4"} gap-8 md:gap-12 lg:gap-16`}
        >
          {portfolioData.map((section, index) => (
            <motion.div
              key={section.id}
              className="relative group overflow-hidden rounded-2xl shadow-xl"
              style={{
                height: `${section.height}px`,
                marginTop: isMobile
                  ? "0px"
                  : section.position === "down"
                    ? "96px"
                    : "0px",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3 },
              }}
            >
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300 z-10" />
              <div className="relative w-full h-full">
                <AnimatePresence>
                  <motion.div
                    key={section.images[currentIndices[index]]}
                    className="absolute w-full h-full"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <Image
                      src={section.images[currentIndices[index]]}
                      alt={`Portfolio image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      priority={index === 0}
                      className="object-cover rounded-2xl"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/70 to-transparent z-20 rounded-b-2xl">
                      <div className="absolute bottom-4 left-4 text-white">
                        <h2 className="text-xl font-bold">{section.title}</h2>
                        <p className="text-sm opacity-80">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioGrid;
