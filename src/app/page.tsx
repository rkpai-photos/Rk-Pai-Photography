import Header from "@/sections/Header";
import Hero from "@/sections/Hero";
import About from "@/sections/About";
import Projects from "@/sections/Projects";
import SlideShow from "@/sections/SlideShow";
import Footer from "@/sections/Footer";
import { fetchPhotos } from "@/lib/photo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const photos = await fetchPhotos();

  // Projects only needs id/src/alt; SlideShow handles its own slice + shape.
  const projects = photos.slice(0, 5).map((photo) => ({
    id: photo.id,
    src: photo.src,
    alt: photo.alt || "Project image",
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
