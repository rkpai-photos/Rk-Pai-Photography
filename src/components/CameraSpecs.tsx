import { Camera, Aperture, Clock, Zap } from "lucide-react";

interface CameraSpecsProps {
  specs: {
    camera: string;
    lens: string;
    focalLength: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
  };
}

export default function CameraSpecs({ specs }: CameraSpecsProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 shadow-inner">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Camera Specs
      </h2>
      <ul className="space-y-3">
        <li className="flex items-center">
          <Camera className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Camera:
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {specs.camera}
          </span>
        </li>
        <li className="flex items-center">
          <Camera className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Lens:
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {specs.lens}
          </span>
        </li>
        <li className="flex items-center">
          <Camera className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Focal Length:
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {specs.focalLength}
          </span>
        </li>
        <li className="flex items-center">
          <Aperture className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Aperture:
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {specs.aperture}
          </span>
        </li>
        <li className="flex items-center">
          <Clock className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            Shutter Speed:
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {specs.shutterSpeed}
          </span>
        </li>
        <li className="flex items-center">
          <Zap className="w-5 h-5 mr-2 text-purple-500" />
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            ISO:
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            {specs.iso}
          </span>
        </li>
      </ul>
    </div>
  );
}
