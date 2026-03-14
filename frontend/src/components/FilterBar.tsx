"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const STATUSES = [
  { value: "", label: "All" },
  { value: "job", label: "Working" },
  { value: "studying", label: "Studying" },
  { value: "business", label: "Business" },
  { value: "farming", label: "Farming" },
  { value: "other", label: "Other" },
];

function FilterBarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("current_status") ?? "";

  const setStatus = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("current_status", val);
    else params.delete("current_status");
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {STATUSES.map((s) => (
        <button
          key={s.value}
          onClick={() => setStatus(s.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            current === s.value
              ? "bg-green-600 text-white shadow-md shadow-green-200"
              : "bg-white text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

export default function FilterBar() {
  return (
    <Suspense fallback={<div className="h-12 mb-8" />}>
      <FilterBarInner />
    </Suspense>
  );
}
