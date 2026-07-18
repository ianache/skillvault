"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Suspense } from "react";

function SearchBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // Debounce: update URL 300ms after the user stops typing
  useEffect(() => {
    const t = setTimeout(() => {
      if (pathname === "/") {
        // Already on catalog — update URL param so CatalogClient reacts
        if (value.trim()) {
          router.replace(`/?q=${encodeURIComponent(value.trim())}`, { scroll: false });
        } else {
          router.replace("/", { scroll: false });
        }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [value, pathname, router]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Navigate to catalog immediately on Enter (even from other pages)
      const q = value.trim();
      if (q) router.push(`/?q=${encodeURIComponent(q)}`);
      else router.push("/");
    }
    if (e.key === "Escape") {
      setValue("");
      if (pathname === "/") router.replace("/", { scroll: false });
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
