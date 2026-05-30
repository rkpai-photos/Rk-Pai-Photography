// Thin analytics wrapper. Fires Google Analytics gtag events when a GA tag is
// present (mounted via <GoogleAnalytics> in the feather-fables layout when
// NEXT_PUBLIC_GA_ID is set); no-ops otherwise so dev + non-GA hosts never throw.

export type AnalyticsEvent =
  | "book_opened"
  | "page_turned"
  | "pdf_downloaded"
  | "fullscreen_enabled";

type Props = Record<string, string | number | boolean>;

export function trackEvent(name: AnalyticsEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("event", name, props);
  } else if (process.env.NODE_ENV !== "production") {
    // Visible in dev so events can be confirmed before GA is configured.
    console.debug("[analytics]", name, props);
  }
}
