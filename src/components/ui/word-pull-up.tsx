import React, { useRef, ReactNode } from "react";
import { motion } from "framer-motion";

interface WordPullUpProps {
  children: ReactNode | string;
  delay?: number;
}

export const WordPullUp: React.FC<WordPullUpProps> = ({
  children,
  delay = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitWords = (text: string) => {
    return text.split(" ").map((word, i) => (
      <span key={i} className="inline-block overflow-hidden mr-[0.25em]">
        <motion.span
          className="inline-block"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.1,
            ease: [0.33, 1, 0.68, 1],
          }}
        >
          {word}
        </motion.span>
      </span>
    ));
  };

  return (
    <div ref={containerRef} className="inline">
      {typeof children === "string" ? splitWords(children) : children}
    </div>
  );
};

export default WordPullUp;