"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function MobileStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/95 backdrop-blur-sm border-t border-border/40 md:hidden">
      <div className="flex gap-2">
        <Link href="/register?track=ap" className="flex-1">
          <Button size="sm" className="w-full gap-1 bg-indigo-600 hover:bg-indigo-700 text-white">
            Start Free <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/register?track=clep" className="flex-1">
          <Button size="sm" className="w-full gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
            CLEP Prep <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
