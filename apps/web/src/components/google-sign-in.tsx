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

export function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const t = useT();
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      onSuccess(response.credential);
    },
    [onSuccess],
  );

  // Load the Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

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

  // Initialize GSI once loaded
  useEffect(() => {
    if (!gsiLoaded || !window.google?.accounts || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    });

    if (containerRef.current) {
      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: 400,
        text: "continue_with",
      });
    }
  }, [gsiLoaded, handleCredentialResponse]);

  if (!GOOGLE_CLIENT_ID) {
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
