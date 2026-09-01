"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteClientButton({ leadId, businessName }: { leadId: string; businessName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(
      `Delete "${businessName}"? This removes their products, videos, posts and messages from Reelio.\n\n` +
        `This does NOT cancel any real Stripe subscription — cancel that separately first if they're a paying client.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      title="Delete client"
      className="text-neutral-600 hover:text-red-400 transition disabled:opacity-50"
    >
      <Trash2 size={14} />
    </button>
  );
}
