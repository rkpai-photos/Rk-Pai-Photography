import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import About from "@/sections/About";
import Projects from "@/sections/Projects";
import SlideShow from "@/sections/SlideShow";
import Footer from "@/sections/Footer";
import { fetchPhotos } from "@/lib/photo";

// ISR: re-render at most once a minute instead of on every request. Cuts the
// per-request Convex round-trip from the critical path; admin edits surface
// within ~60s. (Was force-dynamic.)
export const revalidate = 60;

export default async function Home() {
  const photos = await fetchPhotos();

  // Projects only needs id/src/alt + blur; SlideShow handles its own shape.
  const projects = photos.slice(0, 5).map((photo) => ({
    id: photo.id,
    src: photo.src,
    alt: photo.alt || "Project image",
    blurDataURL: photo.blurDataURL,
  }));

  return (
    <>
      <Header />
      <Hero />
      <SlideShow photos={photos.slice(0, 10)} />
      <About />
      <Projects projects={projects} />
      <Footer />
    </>
  );
}
