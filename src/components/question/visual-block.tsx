"use client";

/**
 * VisualBlock — client-only renderer for Mermaid + vega-lite stimuli.
 *
 * Catches fenced code blocks emitted by the generator:
 *
 *   ```mermaid
 *   graph TD; A-->B; B-->C
 *   ```
 *
 *   ```vega-lite
 *   {"mark":"bar","data":{"values":[{"a":"A","b":28},{"a":"B","b":55}]},
 *    "encoding":{"x":{"field":"a","type":"nominal"},"y":{"field":"b","type":"quantitative"}}}
 *   ```
 *
 * Both libs are heavy (~600 KB combined gzipped). Loaded only when a question
 * actually contains a visual block — react-markdown's code slot only mounts
 * this component for matching languages. SSR is disabled so they never run on
 * the Cloudflare Workers edge.
 */

import { useEffect, useRef, useState } from "react";

let mermaidInit = false;

export function MermaidBlock({ source }: { source: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("mermaid");
        const mermaid = mod.default;
        if (!mermaidInit) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "strict",
            fontFamily: "inherit",
          });
          mermaidInit = true;
        }
        const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
        const { svg } = await mermaid.render(id, source.trim());
        if (!cancelled) setSvg(svg);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Mermaid render failed");
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  if (error) {
    return (
      <pre className="my-2 overflow-x-auto rounded border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
        Diagram failed to render. Source:{"\n\n"}{source}
      </pre>
    );
  }
  if (!svg) {
    return (
      <div className="my-2 flex h-40 items-center justify-center rounded border border-border/40 bg-muted/30 text-xs text-muted-foreground">
        Loading diagram…
      </div>
    );
  }
  return (
    <div
      ref={ref}
      className="my-2 overflow-x-auto rounded border border-border/40 bg-white p-3 dark:bg-white/95"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function VegaLiteBlock({ source }: { source: string }) {
  const [bundle, setBundle] = useState<{ View: any; spec: any } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const spec = JSON.parse(source);
        // vega-lite specs need the schema URL hint so vega-embed picks the
        // right compiler. If the generator omits it, inject one.
        if (!spec.$schema) {
          spec.$schema = "https://vega.github.io/schema/vega-lite/v5.json";
        }
        const reactVega = await import("react-vega");
        if (!cancelled) setBundle({ View: reactVega.VegaEmbed, spec });
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "vega-lite parse failed");
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  if (error) {
    return (
      <pre className="my-2 overflow-x-auto rounded border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
        Chart failed to render. Spec:{"\n\n"}{source}
      </pre>
    );
  }
  if (!bundle) {
    return (
      <div className="my-2 flex h-40 items-center justify-center rounded border border-border/40 bg-muted/30 text-xs text-muted-foreground">
        Loading chart…
      </div>
    );
  }
  const { View, spec } = bundle;
  return (
    <div className="my-2 overflow-x-auto rounded border border-border/40 bg-white p-2 dark:bg-white/95">
      <View spec={spec} options={{ actions: false, renderer: "svg" }} />
    </div>
  );
}
