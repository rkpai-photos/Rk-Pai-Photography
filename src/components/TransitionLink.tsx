"use client";

// Drop-in <Link> replacement that triggers the page-transition loader on click
// before letting next/link navigate. Skips the loader for:
//   • clicks with modifier keys (cmd/ctrl/shift/alt — opening in new tab)
//   • non-primary mouse buttons
//   • external / mailto: / tel: URLs
//   • same-pathname links (hash-only links on the current page)
//   • /admin* targets
//
// For programmatic navigations (router.push in Header.tsx), use
// `useStartPageTransition` from page-transition.ts instead.

import Link from "next/link";
import { useSetAtom } from "jotai";
import { usePathname } from "next/navigation";
import { type ComponentProps, type MouseEvent } from "react";

import { pageTransitionAtom, isSuppressedPath } from "./page-transition";

type Props = ComponentProps<typeof Link>;

export default function TransitionLink({
  href,
  onClick,
  children,
  ...rest
}: Props) {
  const setState = useSetAtom(pageTransitionAtom);
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Resolve the href to a string for our checks. next/link accepts
    // string | UrlObject; the UrlObject case is rare here.
    const hrefStr =
      typeof href === "string" ? href : (href?.pathname ?? "") + (href?.hash ?? "");
    if (!hrefStr) return;
    if (/^(https?:|mailto:|tel:)/.test(hrefStr)) return;
    if (isSuppressedPath(hrefStr) || isSuppressedPath(pathname)) return;

    const targetPath = hrefStr.startsWith("/")
      ? hrefStr.split("#")[0] || "/"
      : hrefStr;
    if (targetPath === pathname) return;

    setState((s) => ({
      visible: true,
      transitionId: s.transitionId + 1,
      startedAt: Date.now(),
    }));
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
