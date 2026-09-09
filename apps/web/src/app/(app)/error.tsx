"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/use-t";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl font-semibold text-accent mb-4">!</div>
        <h2 className="text-xl font-semibold text-text">
          {t("common.error")}
        </h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {error.message || t("common.error")}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>{t("common.retry")}</Button>
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            {t("errors.goHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
