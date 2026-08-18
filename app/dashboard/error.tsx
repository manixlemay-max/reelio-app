"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-10">
      <h1 className="text-xl font-semibold mb-2">Something went wrong on this page</h1>
      <p className="text-sm text-neutral-500 mb-4 max-w-lg">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition"
      >
        Try again
      </button>
    </div>
  );
}
