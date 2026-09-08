"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      fontFamily: "system-ui, sans-serif",
      padding: "2rem",
      backgroundColor: "#FAFAF8",
      color: "#1A1A18",
    }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
        Something went wrong
      </h2>
      <p style={{ marginTop: "0.5rem", color: "#6B6960", fontSize: "0.875rem" }}>
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: "1.5rem",
          padding: "0.5rem 1.5rem",
          backgroundColor: "#8B7355",
          color: "white",
          border: "none",
          borderRadius: "2px",
          fontSize: "0.875rem",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
