"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="block w-full text-left rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300 transition"
    >
      Log out
    </button>
  );
}
