import type { Metadata } from "next";
import { Russo_One, Chakra_Petch, Oswald, Manrope, Montserrat } from "next/font/google";
import "./globals.css";
import "./surface.css";
import { ErrorReporter } from "@/components/error-reporter";

// Display — Russo One (включает кириллицу).
const russo = Russo_One({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-russo",
  display: "swap",
});

// Body — Chakra Petch (латиница; кириллица откатывается на system-ui, как в прототипе).
const chakra = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap",
});

// Шрифты сайта: Oswald - заголовки и подписи, Manrope - текст.
const oswald = Oswald({ subsets: ["latin", "cyrillic"], variable: "--font-oswald", display: "swap" });
const manrope = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-manrope", display: "swap" });

// Шрифт виджета «Задания V2» в оверлее: файл качается, только когда виджет на экране.
const montserrat = Montserrat({ weight: ["800", "900"], subsets: ["latin", "cyrillic"], variable: "--font-montserrat", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Лига Ultimate Royale — PUBG Mobile",
  description:
    "Лига Ultimate Royale по PUBG Mobile в прямом эфире: соло против сквадов, матчи 1×1, рейтинг MMR и шоу-матчи с призами.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${russo.variable} ${chakra.variable} ${oswald.variable} ${manrope.variable} ${montserrat.variable}`}>
      <body>
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
