import { redirect } from "next/navigation";
import { getMe } from "@/lib/queries";
import { SurfaceLogin } from "@/components/surface/pages/auth";

export const metadata = {
  title: "Вход — Лига Ultimate Royale",
  description: "Вход по логину и паролю.",
};

// safeInternalRedirect — пускает только внутренний путь. Резолвим относительно фиктивного
// origin ровно так, как это сделает router.push (WHATWG URL), и требуем совпадения origin:
// это ловит и "//host", и бэкслеш-трюк "/\host" (его prefix-проверка пропускала).
function safeInternalRedirect(raw: string | undefined): string | undefined {
  if (typeof raw !== "string" || !raw.startsWith("/")) return undefined;
  try {
    const base = "https://internal.invalid";
    const u = new URL(raw, base);
    if (u.origin !== base) return undefined;
    return u.pathname + u.search + u.hash;
  } catch {
    return undefined;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const user = await getMe();
  if (user) redirect("/");

  const sp = await searchParams;
  const redirectTo = safeInternalRedirect(sp.redirect);
  return <SurfaceLogin redirectTo={redirectTo} />;
}
