/* eslint-disable */
// @ts-nocheck
"use client";
import { useCursor, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAtom } from "jotai";
import { easing } from "maath";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bone,
  BoxGeometry,
  Color,
  Float32BufferAttribute,
  MathUtils,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  SRGBColorSpace,
  Uint16BufferAttribute,
  Vector3,
} from "three";
import { degToRad } from "three/src/math/MathUtils.js";

// Constants — pages match the Feather Fables book page aspect (A4 landscape,
// 2200×1556 ≈ 1.414) so the rendered book-page textures map with no stretch.
// Width is held at 1.71 (keeps the skin-index edge guard below valid and the
// camera framing in Experience.jsx unchanged); height follows from the aspect.
const PAGE_WIDTH = 1.71;
const PAGE_HEIGHT = 1.71 / (2200 / 1556); // ≈ 1.209
const PAGE_DEPTH = 0.003;
const PAGE_SEGMENTS = 30;
const SEGMENT_WIDTH = PAGE_WIDTH / PAGE_SEGMENTS;

// Create atom for page state
import { atom } from "jotai";
export const pageAtom = atom(0);

// Album faces, in reading order: the real front cover (book page 1), content
// pages 37–101, the decorative peacock endpaper (page 107), then the back cover
// (page 108). Textures live in /public/textures/album (built by
// scripts/convert-textures.sh from /public/books/feather-fables). 1 cover + 65
// pages + endpaper + back = 68 faces = 34 leaves (even), so every leaf has a
// front and a back.
const faces = ["cover"];
for (let p = 37; p <= 101; p++) {
  faces.push(`page-${String(p).padStart(3, "0")}`);
}
faces.push("page-107"); // decorative peacock endpaper (inside back cover)
faces.push("page-108"); // back cover

// Pair consecutive faces into physical leaves.
export const pages = [];
for (let i = 0; i < faces.length; i += 2) {
  pages.push({ front: faces[i], back: faces[i + 1] });
}

// Create page geometry
const pageGeometry = new BoxGeometry(
  PAGE_WIDTH,
  PAGE_HEIGHT,
  PAGE_DEPTH,
  PAGE_SEGMENTS,
  2,
);

pageGeometry.translate(PAGE_WIDTH / 2, 0, 0);

const position = pageGeometry.attributes.position;
const vertex = new Vector3();
const skinIndexes = [];
const skinWeights = [];

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  const x = vertex.x;
  // Each vertex blends between bones[skinIndex] and bones[skinIndex+1]. There
  // are PAGE_SEGMENTS+1 bones total (indices 0..PAGE_SEGMENTS), so skinIndex+1
  // must be ≤ PAGE_SEGMENTS — i.e. skinIndex ≤ PAGE_SEGMENTS-1. At the far
  // edge of the page (x ≈ PAGE_WIDTH), Math.floor(x / SEGMENT_WIDTH) can land
  // exactly on PAGE_SEGMENTS depending on floating-point rounding of the
  // division (1.71/30 rounds *up* at the edge; the old 1.28/30 happened to
  // round down, which is why this latent bug only surfaced after the 3:4 →
  // 3:2 dimension change). The crash was "skeleton.bones[boneIndex] is
  // undefined" inside Three's SkinnedMesh update.
  const rawIdx = Math.floor(x / SEGMENT_WIDTH);
  let skinIndex;
  let skinWeight;
  if (rawIdx >= PAGE_SEGMENTS) {
    // Past the last bone — snap the vertex to bone PAGE_SEGMENTS.
    skinIndex = PAGE_SEGMENTS - 1;
    skinWeight = 1;
  } else if (rawIdx < 0) {
    skinIndex = 0;
    skinWeight = 0;
  } else {
    skinIndex = rawIdx;
    skinWeight = (x % SEGMENT_WIDTH) / SEGMENT_WIDTH;
  }
  skinIndexes.push(skinIndex, skinIndex + 1, 0, 0);
  skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
}

pageGeometry.setAttribute(
  "skinIndex",
  new Uint16BufferAttribute(skinIndexes, 4),
);
pageGeometry.setAttribute(
  "skinWeight",
  new Float32BufferAttribute(skinWeights, 4),
);

// Constants for materials
const whiteColor = new Color("white");
const emissiveColor = new Color("white");

const pageMaterials = [
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: "#111" }),
  new MeshStandardMaterial({ color: whiteColor }),
  new MeshStandardMaterial({ color: whiteColor }),
];

// Animation constants
const easingFactor = 0.5;
const easingFactorFold = 0.3;
const insideCurveStrength = 0.18;
const outsideCurveStrength = 0.05;
const turningCurveStrength = 0.09;

// Page Component
const Page = ({ number, front, back, page, opened, bookClosed, ...props }) => {
  // Book-page textures (see scripts/convert-textures.sh) already match the page
  // aspect, so they map without stretching. The front cover (leaf 0) and the
  // back cover (last leaf) get the roughness map for that hard-cover sheen.
  const [picture, picture2, pictureRoughness] = useTexture([
    `/textures/album/${front}.webp`,
    `/textures/album/${back}.webp`,
    ...(number === 0 || number === pages.length - 1
      ? [`/textures/bookrough.webp`]
      : []),
  ]);

  picture.colorSpace = picture2.colorSpace = SRGBColorSpace;
  picture.flipY = picture2.flipY = true;

  const group = useRef();
  const turnedAt = useRef(0);
  const lastOpened = useRef(opened);
  const skinnedMeshRef = useRef();

  const manualSkinnedMesh = useMemo(() => {
    const bones = [];
    for (let i = 0; i <= PAGE_SEGMENTS; i++) {
      let bone = new Bone();
      bones.push(bone);
      if (i === 0) {
        bone.position.x = 0;
      } else {
        bone.position.x = SEGMENT_WIDTH;
      }
      if (i > 0) {
        bones[i - 1].add(bone);
      }
    }

    const skeleton = new Skeleton(bones);
    const materials = [
      ...pageMaterials,
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture,
        ...(number === 0
          ? { roughnessMap: pictureRoughness }
          : { roughness: 0.1 }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
      new MeshStandardMaterial({
        color: whiteColor,
        map: picture2,
        ...(number === pages.length - 1
          ? { roughnessMap: pictureRoughness }
          : { roughness: 0.1 }),
        emissive: emissiveColor,
        emissiveIntensity: 0,
      }),
    ];

    const mesh = new SkinnedMesh(pageGeometry, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.add(skeleton.bones[0]);
    mesh.bind(skeleton);
    return mesh;
  }, []);

  useFrame((_, delta) => {
    if (!skinnedMeshRef.current) return;

    const emissiveIntensity = highlighted ? 0.22 : 0;
    skinnedMeshRef.current.material[4].emissiveIntensity =
      skinnedMeshRef.current.material[5].emissiveIntensity = MathUtils.lerp(
        skinnedMeshRef.current.material[4].emissiveIntensity,
        emissiveIntensity,
        0.1,
      );

    if (lastOpened.current !== opened) {
      turnedAt.current = +new Date();
      lastOpened.current = opened;
    }

    let turningTime = Math.min(400, new Date() - turnedAt.current) / 400;
    turningTime = Math.sin(turningTime * Math.PI);

    let targetRotation = opened ? -Math.PI / 2 : Math.PI / 2;
    if (!bookClosed) {
      targetRotation += degToRad(number * 0.8);
    }

    const bones = skinnedMeshRef.current.skeleton.bones;
    for (let i = 0; i < bones.length; i++) {
      const target = i === 0 ? group.current : bones[i];

      const insideCurveIntensity = i < 8 ? Math.sin(i * 0.2 + 0.25) : 0;
      const outsideCurveIntensity = i >= 8 ? Math.cos(i * 0.3 + 0.09) : 0;
      const turningIntensity =
        Math.sin(i * Math.PI * (1 / bones.length)) * turningTime;

      let rotationAngle =
        insideCurveStrength * insideCurveIntensity * targetRotation -
        outsideCurveStrength * outsideCurveIntensity * targetRotation +
        turningCurveStrength * turningIntensity * targetRotation;

      let foldRotationAngle = degToRad(Math.sign(targetRotation) * 2);

      if (bookClosed) {
        if (i === 0) {
          rotationAngle = targetRotation;
          foldRotationAngle = 0;
        } else {
          rotationAngle = 0;
          foldRotationAngle = 0;
        }
      }

      easing.dampAngle(
        target.rotation,
        "y",
        rotationAngle,
        easingFactor,
        delta,
      );

      const foldIntensity =
        i > 8
          ? Math.sin(i * Math.PI * (1 / bones.length) - 0.5) * turningTime
          : 0;

      easing.dampAngle(
        target.rotation,
        "x",
        foldRotationAngle * foldIntensity,
        easingFactorFold,
        delta,
      );
    }
  });

  const [, setPage] = useAtom(pageAtom);
  const [highlighted, setHighlighted] = useState(false);
  useCursor(highlighted);

  return (
    <group
      {...props}
      ref={group}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHighlighted(true);
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHighlighted(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setPage(opened ? number : number + 1);
        setHighlighted(false);
      }}
    >
      <primitive
        object={manualSkinnedMesh}
        ref={skinnedMeshRef}
        position-z={-number * PAGE_DEPTH + page * PAGE_DEPTH}
      />
    </group>
  );
};

// Book Component
export const Book = ({ ...props }) => {
  const [page] = useAtom(pageAtom);
  const [delayedPage, setDelayedPage] = useState(page);

  useEffect(() => {
    let timeout;
    const goToPage = () => {
      setDelayedPage((delayedPage) => {
        if (page === delayedPage) {
          return delayedPage;
        } else {
          timeout = setTimeout(
            () => {
              goToPage();
            },
            Math.abs(page - delayedPage) > 2 ? 50 : 150,
          );
          if (page > delayedPage) {
            return delayedPage + 1;
          }
          if (page < delayedPage) {
            return delayedPage - 1;
          }
        }
      });
    };
    goToPage();
    return () => {
      clearTimeout(timeout);
    };
  }, [page]);

  return (
    <group {...props} rotation-y={-Math.PI / 2}>
      {pages.map((pageData, index) => (
        <Page
          key={index}
          page={delayedPage}
          number={index}
          opened={delayedPage > index}
          bookClosed={delayedPage === 0 || delayedPage === pages.length}
          {...pageData}
        />
      ))}
    </group>
  );
};
