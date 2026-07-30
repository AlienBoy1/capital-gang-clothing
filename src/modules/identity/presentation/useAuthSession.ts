"use client";

import { useEffect, useState } from "react";

/** Lightweight session probe for public UI (logout / panel links). */
export function useAuthSession() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => {
        if (cancelled) return;
        setAuthenticated(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ready, authenticated };
}
