import { redirect } from "next/navigation";
import { getMe } from "@/lib/queries";
import { SurfaceRegister } from "@/components/surface/pages/auth";

export const metadata = {
  title: "Регистрация — Лига Ultimate Royale",
  description: "Создай аккаунт по логину и паролю, чтобы записываться на турниры и загружать хайлайты.",
};

export default async function RegisterPage() {
  const user = await getMe();
  if (user) redirect("/profile");
  return <SurfaceRegister />;
}
