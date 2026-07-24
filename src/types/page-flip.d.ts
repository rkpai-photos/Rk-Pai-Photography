// Minimal type declarations for `page-flip` (StPageFlip), which ships no .d.ts.
// Covers only the surface used by the Feather Fables reader.
declare module "page-flip" {
  export interface FlipSetting {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startPage?: number;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    disableFlipByClick?: boolean;
  }

  export interface WidgetEvent {
    data: unknown; // "flip" → page index (number); "changeOrientation" → string
    object: PageFlip;
  }

  export type FlipCorner = "top" | "bottom";
  export type FlipEvent =
    | "flip"
    | "changeState"
    | "changeOrientation"
    | "init"
    | "update";

  export class PageFlip {
    constructor(element: HTMLElement, settings: FlipSetting);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    loadFromImages(images: string[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    flip(page: number, corner?: FlipCorner): void;
    flipNext(corner?: FlipCorner): void;
    flipPrev(corner?: FlipCorner): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    getOrientation(): "portrait" | "landscape";
    update(): void;
    destroy(): void;
    on(event: FlipEvent, callback: (e: WidgetEvent) => void): void;
    off(event: FlipEvent): void;
  }
}
