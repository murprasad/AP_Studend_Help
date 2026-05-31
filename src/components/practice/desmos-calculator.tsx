"use client";

/**
 * 2026-05-31 — Desmos calculator embed for SAT/PSAT Math practice (F4 of
 * the SAT=CB parity sprint #100). College Board embeds Desmos on every
 * Math question on the real digital SAT (Bluebook app). For our mock to
 * "feel like the real test" this must be one click away from any SAT_MATH
 * or PSAT_MATH question.
 *
 * Design choices
 * - Collapsible panel — default closed so the calculator doesn't dominate
 *   the question card and doesn't load script bytes for students who
 *   don't need it.
 * - Script is loaded lazily on first open, then cached on window so
 *   subsequent opens don't re-fetch.
 * - API key is the publicly documented Desmos demo key
 *   (dcb31709b452b1cf9dc26972add0fda6) — same one Khan Academy uses on
 *   their official SAT practice. Production sites can swap to a paid
 *   key by setting NEXT_PUBLIC_DESMOS_API_KEY.
 */

import { useEffect, useRef, useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

const DESMOS_API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY ??
  "dcb31709b452b1cf9dc26972add0fda6";
const DESMOS_SCRIPT_SRC = `https://www.desmos.com/api/v1.10/calculator.js?apiKey=${DESMOS_API_KEY}`;

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        el: HTMLElement,
        opts?: Record<string, unknown>,
      ) => { destroy: () => void };
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadDesmosScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Desmos) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${DESMOS_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Desmos script failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = DESMOS_SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("Desmos script failed to load"));
    };
    document.head.appendChild(s);
  });
  return scriptLoadPromise;
}

export function DesmosCalculatorPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calculatorRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadDesmosScript()
      .then(() => {
        if (cancelled) return;
        if (!containerRef.current || !window.Desmos) {
          setError("Couldn't load Desmos. Try refreshing the page.");
          setLoading(false);
          return;
        }
        if (calculatorRef.current) {
          calculatorRef.current.destroy();
        }
        calculatorRef.current = window.Desmos.GraphingCalculator(
          containerRef.current,
          {
            // SAT-aligned defaults: keyboard-friendly + uniform expressions
            // disabled keys that would let students "explore" beyond what
            // Bluebook offers.
            keypad: true,
            graphpaper: true,
            expressions: true,
            settingsMenu: false,
            zoomButtons: true,
            border: false,
            lockViewport: false,
            expressionsTopbar: false,
          },
        );
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, [open]);

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent/40 transition-colors rounded-lg"
        aria-expanded={open}
        aria-controls="desmos-panel"
      >
        <span className="inline-flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          Desmos calculator
          <span className="text-xs text-muted-foreground font-normal">
            (same as the real test)
          </span>
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div id="desmos-panel" className="border-t border-border/40 p-2">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-3">
              {error}
            </div>
          )}
          {loading && !error && (
            <div className="text-sm text-muted-foreground p-3">
              Loading calculator…
            </div>
          )}
          <div
            ref={containerRef}
            // Height matches the real Bluebook panel (~480px graphing area).
            className="w-full h-[480px] rounded-md overflow-hidden"
            aria-label="Desmos graphing calculator"
          />
        </div>
      )}
    </div>
  );
}
