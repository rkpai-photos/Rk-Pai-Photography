import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import debounce from "lodash/debounce";
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
    const onResize = debounce(updateScale, 150);
    window.addEventListener("resize", onResize);
    return () => {
      onResize.cancel();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      {/* Static, near-upright tilt — the drei <Float> bob/rotation was too much
          motion, and a steep lay-back hid the cover. A gentle tilt keeps the
          cover facing the camera; OrbitControls still lets the user turn it. */}
      <group rotation-x={viewport.width < 768 ? -Math.PI / 5 : -Math.PI / 7}>
        <Book scale={bookScale} />
      </group>
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        maxDistance={20}
        minDistance={2}
      />
      {/* Soft fill + a directional key light. The old single ambientLight=4.3
          washed the cream pages to white (lifting the near-black text to gray,
          so it read low-contrast) and, being pure ambient, gave the book no
          shading so it looked flat. Lower fill keeps text crisp; the key light
          adds the gradient that makes the book pop and drives the floor shadow. */}
      <ambientLight intensity={0.9} />
      <directionalLight
        position={[2.5, 5, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <mesh position-y={-1.5} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </>
  );
};
