import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { getMe } from "@/lib/queries";
import { SurfaceShell } from "@/components/surface/shell";

/* Общий «хром» публичной витрины: навбар + футер + контекст авторизации.
   Текущего пользователя подгружаем на сервере (cookie сессии) и отдаём в
   AuthProvider как начальное значение — навбар сразу знает роль, без мигания. */

// Страницы витрины собираются на каждый запрос: при сборке бэкенда нет, а данные живые.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await getMe();
  return (
    <AuthProvider initialUser={user}>
      <SurfaceShell>{children}</SurfaceShell>
    </AuthProvider>
  );
}
