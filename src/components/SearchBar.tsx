"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Suspense } from "react";

function SearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    []
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      // Navigate to catalog with query param; catalog reads it as initial filter
      router.push(`/?q=${encodeURIComponent(value.trim())}`);
    }
    if (e.key === "Escape") {
      setValue("");
      if (pathname === "/") router.push("/");
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <span
        style={{
          position: "absolute",
          left: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--faint)",
          fontSize: "13px",
          pointerEvents: "none",
        }}
      >
        ⌕
      </span>
      <input
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Buscar skills, triggers, herramientas…"
        style={{
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "7px 12px 7px 30px",
          fontSize: "13px",
          color: "var(--text)",
          outline: "none",
          transition: "border-color .12s",
          fontFamily: "inherit",
        }}
        onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--accent)")}
        onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "var(--border)")}
      />
    </div>
  );
}

export function SearchBar() {
  return (
    <Suspense fallback={<div style={{ height: "32px", background: "var(--surface)", borderRadius: "4px", border: "1px solid var(--border)" }} />}>
      <SearchBarInner />
    </Suspense>
  );
}
