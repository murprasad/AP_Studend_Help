"use client";

/**
 * Pull-to-refresh hook (ported from PrepLion).
 *
 * Attach `pullHandlers` to a scrollable container. Triggers `onRefresh`
 * when the user drags down 80+ px from the top of the scroll.
 */

import { useState, useCallback, useRef } from "react";

export function usePullRefresh(onRefresh: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }, []);

  const onTouchEnd = useCallback(
    async (e: React.TouchEvent) => {
      if (!pulling.current) return;
      pulling.current = false;
      const diff = e.changedTouches[0].clientY - startY.current;
      if (diff > 80 && !refreshing) {
        setRefreshing(true);
        try { await onRefresh(); } catch { /* surface elsewhere */ }
        setRefreshing(false);
      }
    },
    [onRefresh, refreshing],
  );

  return { refreshing, pullHandlers: { onTouchStart, onTouchEnd } };
}
