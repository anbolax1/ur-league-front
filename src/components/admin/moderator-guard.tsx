"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { roleAtLeast } from "@/lib/roles";

/** Модератору открыты только проверка профилей и очередь; в остальные разделы кабинета его возвращает сюда. */
export function ModeratorGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname() || "";
  const router = useRouter();
  const limited = !roleAtLeast(user?.role, "superadmin");
  const allowed = pathname.startsWith("/admin/moderation") || pathname.startsWith("/admin/queue");
  React.useEffect(() => {
    if (limited && !allowed) router.replace("/admin/moderation");
  }, [limited, allowed, router]);
  return limited && !allowed ? null : <>{children}</>;
}
