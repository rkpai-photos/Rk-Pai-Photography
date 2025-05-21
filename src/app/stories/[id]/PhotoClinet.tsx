"use client";

import { useState } from "react";
import { Calendar, Heart, Share2 } from "lucide-react";

interface PhotoDetailClientProps {
  initialCreatedAt: string | Date;
}

export default function PhotoDetailClient({
  initialCreatedAt,
}: PhotoDetailClientProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLikeToggle = () => {
    setIsLiked(!isLiked);
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 w-full md:w-auto">
      <div className="flex flex-col md:flex-row items-center text-gray-600 dark:text-gray-300 bg-white/20 dark:bg-gray-700/20 px-3 py-1 md:px-4 md:py-2 rounded-full font-light w-full md:w-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            <span className="font-mont text-xs sm:text-sm md:text-base">
              {new Date(initialCreatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex ml-2 md:ml-4 space-x-3 relative">
            <div
              className={`relative ${isLiked ? "animate-ping absolute inset-0 bg-red-200 rounded-full" : "hidden"}`}
            ></div>
            <Heart
              onClick={handleLikeToggle}
              className={`w-5 h-5 cursor-pointer transition-all duration-300 ease-in-out transform ${
                isLiked
                  ? "text-red-500 fill-red-500 scale-125 "
                  : "text-gray-600 dark:text-gray-300 hover:text-red-500 scale-100"
              }`}
              strokeWidth={1.5}
              fill={isLiked ? "currentColor" : "none"}
            />
            <Share2
              className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-blue-500 cursor-pointer transition-colors"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
