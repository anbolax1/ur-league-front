import { SurfaceProfile } from "@/components/surface/pages/profile";

/** Логин из адреса: Next может отдать его ещё закодированным (кириллица - `%D0%A5…`), а запрос к API кодирует его сам. */
function loginFromPath(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ login: string }> }) {
  const { login } = await params;
  return <SurfaceProfile login={loginFromPath(login)} />;
}
