import { Float, OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { Book } from "./Book";

export const Experience = () => {
  const { viewport } = useThree();
  const [bookScale, setBookScale] = useState([1.3, 1.3, 1.3]);

  useEffect(() => {
    const updateScale = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      if (isMobile) {
        setBookScale([0.97, 0.97, 0.97]);
      } else if (isTablet) {
        setBookScale([1, 1, 1]);
      } else {
        setBookScale([1.2, 1.2, 1.2]);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <>
      <Float
        rotateX={viewport.width < 768 ? -Math.PI / 3 : -Math.PI / 4}
        floatIntensity={viewport.width < 768 ? 0.5 : 1}
        speed={2}
        rotationIntensity={viewport.width < 768 ? 1 : 2}
      >
        <Book scale={bookScale} />
      </Float>
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        maxDistance={20}
        minDistance={2}
      />
      <ambientLight intensity={4.3} />
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};
