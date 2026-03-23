"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminPageNav() {
  const pathname = usePathname();
  const isManage = pathname.startsWith("/admin/manage");

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 w-fit">
      <Link
        href="/admin"
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          !isManage
            ? "bg-blue-600 text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monitor
      </Link>
      <Link
        href="/admin/manage"
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          isManage
            ? "bg-blue-600 text-white"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Manage
      </Link>
    </div>
  );
}
