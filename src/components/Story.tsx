import { BookOpen } from "lucide-react";

interface StoryProps {
  story: string;
}

export default function Story({ story }: StoryProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 shadow-inner">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
        <BookOpen className="w-6 h-6 mr-2 text-purple-500" />
        Story Behind the Image
      </h2>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {story}
      </p>
    </div>
  );
}
