/* eslint-disable */
// @ts-nocheck
import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import About from "@/sections/About";
import Projects from "@/sections/Projects";
import SlideShow from "@/sections/SlideShow";
import Footer from "@/sections/Footer";
import { fetchPhotos } from "@/lib/photo"; // Changed from googleSheets to the main photo module

export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch photos from the updated fetchPhotos function that now uses Google Sheets
  const photos = await fetchPhotos();

  // Create projects array from the first 5 photos
  // Handle both old and new data structures
  const projects = photos.slice(0, 5).map((photo) => ({
    id: photo.id,
    src: photo.src || photo.image_url, // Use image_url as fallback
    alt: photo.alt || "Project image",
    story: photo.story || "",
    // Add any additional fields that might be needed by the Projects component
    createdAt: photo.createdAt || photo.created_at,
  }));

  return (
    <>
      <Header />
      <Hero />
      <SlideShow photos={photos.slice(0, 10)} />{" "}
      {/* Pass photos to SlideShow if needed */}
      <About />
      <Projects projects={projects} />
      <Footer />
    </>
  );
}
