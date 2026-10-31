import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { getHiddenPlayers, getMe } from "@/lib/queries";
import { HiddenPlayersProvider } from "@/components/surface/player-link";
import { SurfaceShell } from "@/components/surface/shell";

/* Общий «хром» публичной витрины: навбар + футер + контекст авторизации.
   Текущего пользователя подгружаем на сервере (cookie сессии) и отдаём в
   AuthProvider как начальное значение — навбар сразу знает роль, без мигания. */

// Страницы витрины собираются на каждый запрос: при сборке бэкенда нет, а данные живые.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [user, hidden] = await Promise.all([getMe(), getHiddenPlayers()]);
  return (
    <AuthProvider initialUser={user}>
      <HiddenPlayersProvider logins={hidden}>
        <SurfaceShell>{children}</SurfaceShell>
      </HiddenPlayersProvider>
    </AuthProvider>
  );
}
