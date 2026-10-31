"use client";

import * as React from "react";
import Link from "next/link";

const HiddenContext = React.createContext<ReadonlySet<string>>(new Set());

/** Логины удалённых игроков для всей витрины: ссылки на них становятся обычным текстом. */
export function HiddenPlayersProvider({ logins, children }: { logins: string[]; children: React.ReactNode }) {
  const set = React.useMemo(() => new Set(logins.map((l) => l.toLowerCase())), [logins]);
  return <HiddenContext.Provider value={set}>{children}</HiddenContext.Provider>;
}

/** Удалён ли игрок с сайта: страницы у него нет. */
export function useIsHidden(): (login: string | undefined) => boolean {
  const set = React.useContext(HiddenContext);
  return (login) => !!login && set.has(login.toLowerCase());
}

/** Ссылка на профиль игрока; у удалённого с сайта игрока страницы нет, поэтому остаётся только ник. */
export function ProfileLink({ login, children, ...rest }: Omit<React.ComponentProps<typeof Link>, "href"> & { login: string }) {
  const hidden = React.useContext(HiddenContext).has(login.toLowerCase());
  if (hidden) {
    const { className, style, title } = rest;
    return (
      <span className={className} style={style} title={title}>
        {children}
      </span>
    );
  }
  return (
    <Link href={`/profile/${encodeURIComponent(login)}`} {...rest}>
      {children}
    </Link>
  );
}
