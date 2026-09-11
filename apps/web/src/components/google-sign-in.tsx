"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/use-t";

interface GoogleSignInButtonProps {
  onSuccess: (idToken: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              shape?: string;
              width?: number;
              text?: string;
            },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/** Google caps its rendered button at this width, whatever we ask for. */
const GSI_MAX_WIDTH = 400;

/**
 * Whether Google sign-in is configured for this build. The auth screens use
 * it the way the app uses `isGoogleAuthAvailable`: no client id, no "or"
 * divider and no Google button at all.
 */
export const isGoogleSignInAvailable = GOOGLE_CLIENT_ID.length > 0;

/**
 * Google's own rendered button (Google requires it for ID-token sign-in),
 * dressed to pass for the app's secondary pill: outline theme, pill shape,
 * large size, and as wide as the column it sits in — measured, since GSI
 * only takes a pixel width. While the script loads, the app's real secondary
 * Button stands in, disabled, so the layout doesn't jump.
 */
export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const t = useT();
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // GSI is initialised once; route the credential through a ref so a parent
  // re-render (every keystroke in the form) doesn't re-initialise and
  // re-render Google's iframe.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    onSuccessRef.current(response.credential);
  }, []);

  // Load the Google Identity Services script
  useEffect(() => {
    if (!isGoogleSignInAvailable) return;

    // Already loaded
    if (window.google?.accounts) {
      startTransition(() => setGsiLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => startTransition(() => setGsiLoaded(true));
    document.head.appendChild(script);
  }, []);

  // Initialize GSI once loaded, and render the button at the container's width
  useEffect(() => {
    if (!gsiLoaded || !window.google?.accounts || !isGoogleSignInAvailable) return;

    const container = containerRef.current;
    if (!container) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    let renderedWidth = 0;
    const render = () => {
      const width = Math.min(
        Math.round(container.getBoundingClientRect().width),
        GSI_MAX_WIDTH,
      );
      if (width === 0 || width === renderedWidth) return;
      renderedWidth = width;

      // renderButton appends; clear the previous iframe before re-rendering
      // at the new width.
      container.replaceChildren();
      window.google?.accounts.id.renderButton(container, {
        type: "standard",
        shape: "pill",
        theme: "outline",
        size: "large",
        width,
        text: "continue_with",
      });
    };

    render();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(render);
    observer.observe(container);
    return () => observer.disconnect();
  }, [gsiLoaded, handleCredentialResponse]);

  if (!isGoogleSignInAvailable) {
    return null;
  }

  // Show fallback button while GSI loads, then show Google's rendered button
  return (
    <div>
      <div ref={containerRef} className="flex justify-center" />
      {!gsiLoaded ? (
        <Button variant="secondary" fullWidth disabled>
          {t("auth.continueWith", { provider: "Google" })}
        </Button>
      ) : null}
    </div>
  );
}
