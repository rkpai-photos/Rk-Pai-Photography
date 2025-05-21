"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { Experience } from "../../components/Experience";
import { UI } from "../../components/UI";

function App() {
  const [cameraPosition, setCameraPosition] = useState([-0.5, 1, 4]);
  const [cameraFov, setCameraFov] = useState(45);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCameraPosition([-0.5, 1, 6]);
        setCameraFov(60);
      } else if (width < 1024) {
        setCameraPosition([-0.5, 1, 6]);
        setCameraFov(50);
      } else {
        setCameraPosition([-0.5, 1, 4]);
        setCameraFov(45);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="absolute inset-0 " />
      </div>

      <UI />

      <div className="absolute inset-0">
        <Canvas
          shadows
          camera={{
            position: cameraPosition,
            fov: cameraFov,
          }}
          className="h-full w-full"
          dpr={[1, 2]}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}

export default App;
