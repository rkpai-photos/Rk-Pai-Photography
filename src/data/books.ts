// Registry of readable books + URL resolvers for the flipbook reader.
//
// Page images resolve from NEXT_PUBLIC_<SLUG>_PAGES_BASE (default: the committed
// /public copy). Pointing that env var at an R2 public URL moves a book's pages
// to R2 with zero code changes. Editions are additive entries in `books`; the
// reader is generic over a `Book`.

export type BookLang = "en" | "kn";

export type Book = {
  id: string;
  slug: string;
  lang: BookLang;
  title: string;
  subtitle?: string;
  author: string;
  pageCount: number;
  aspect: number; // page width / height
  coverPage: number; // 1-based
  pageWidth: number;
  pageHeight: number;
  pdfPath: string; // web-optimized download (default: committed /public copy)
};

const A4_LANDSCAPE = 841.89 / 595.276; // ≈ 1.4143

export const featherFables: Book = {
  id: "feather-fables",
  slug: "feather-fables",
  lang: "en",
  title: "Feather Fables",
  subtitle: "A journey through the world of birds",
  author: "P. Radhakrishna Pai",
  pageCount: 108,
  aspect: A4_LANDSCAPE,
  coverPage: 1,
  pageWidth: 2200,
  pageHeight: 1556,
  pdfPath: "/ebook_Feather_Fables_English.pdf",
};

export const featherFablesKannada: Book = {
  id: "feather-fables-kannada",
  slug: "feather-fables-kannada",
  lang: "kn",
  title: "ಒಂದು ಗರಿಯ ಕಥೆ", // "A Feather's Tale" — Kannada edition of Feather Fables
  subtitle: "ಪಕ್ಷಿಗಳ ಜಗತ್ತಿನ ಪಯಣ", // "A journey through the world of birds"
  author: "P. Radhakrishna Pai",
  pageCount: 107,
  aspect: A4_LANDSCAPE,
  coverPage: 1,
  pageWidth: 2200,
  pageHeight: 1556,
  pdfPath: "/ebook_Feather_Fables_kannada.pdf",
};

const books: Record<string, Book> = {
  [featherFables.slug]: featherFables,
  [featherFablesKannada.slug]: featherFablesKannada,
};

export function getBook(slug: string): Book | undefined {
  return books[slug];
}

export function getBookByLang(lang: string): Book {
  return lang === "kn" ? featherFablesKannada : featherFables;
}

const pad3 = (n: number) => String(n).padStart(3, "0");

// Single switch for /public vs R2 per book: set the env var to an R2 base URL
// (no trailing slash) to serve that book's images from R2.
function pagesBase(book: Book): string {
  const key =
    book.lang === "kn"
      ? process.env.NEXT_PUBLIC_FEATHER_FABLES_KN_PAGES_BASE
      : process.env.NEXT_PUBLIC_FEATHER_FABLES_PAGES_BASE;
  return (key && key.replace(/\/$/, "")) || `/books/${book.slug}`;
}

export function pageUrl(book: Book, n: number): string {
  return `${pagesBase(book)}/page-${pad3(n)}.webp`;
}

export function thumbUrl(book: Book, n: number): string {
  return `${pagesBase(book)}/thumbs/thumb-${pad3(n)}.webp`;
}

// Web-optimized PDF download for a book (committed /public copy by default).
export function webPdfUrl(book: Book): string {
  return book.pdfPath;
}
