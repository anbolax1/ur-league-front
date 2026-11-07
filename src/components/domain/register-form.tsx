"use client";

import * as React from "react";
import { api, errorText } from "@/lib/api";
import type { User } from "@/lib/types";

/** Целое из поля: пусто - null, не число - NaN. */
function parseCount(v: string): number | null {
  const t = v.replace(/\s/g, "");
  if (!t) return null;
  return /^\d+$/.test(t) ? Number(t) : Number.NaN;
}

/** K/D с запятой или точкой: пусто - null, не число - NaN. */
function parseKd(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  return /^\d{1,2}(\.\d{1,2})?$/.test(t) ? Number(t) : Number.NaN;
}

/** Анкета заявки в общий пул: ID и ник в игре подставляются из профиля, остальное игрок пишет о себе. */
export function useJoinRequest(user: User) {
  const [gameNick, setGameNick] = React.useState(user.gameNick ?? "");
  const [gameId, setGameId] = React.useState(user.gameId ?? "");
  const [rank, setRank] = React.useState("");
  const [kd, setKd] = React.useState("");
  const [matches, setMatches] = React.useState("");
  const [wins, setWins] = React.useState("");
  const [kills, setKills] = React.useState("");
  const [playTime, setPlayTime] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = React.useState("");

  const nums = { kd: parseKd(kd), matches: parseCount(matches), wins: parseCount(wins), kills: parseCount(kills) };
  const winsOverMatches = nums.wins !== null && nums.matches !== null && nums.wins > nums.matches;
  const bad = {
    gameId: gameId.trim() !== "" && !/^\d{6,12}$/.test(gameId.replace(/\s/g, "")),
    kd: Number.isNaN(nums.kd),
    matches: Number.isNaN(nums.matches),
    wins: Number.isNaN(nums.wins) || winsOverMatches,
    kills: Number.isNaN(nums.kills),
  };
  const valid = gameNick.trim() !== "" && gameId.trim() !== "" && !Object.values(bad).some(Boolean);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setStatus("sending");
    setError("");
    try {
      await api.post(`/registrations`, {
        gameId: gameId.replace(/\s/g, ""),
        gameNick: gameNick.trim(),
        rank,
        kd: nums.kd,
        matches: nums.matches,
        wins: nums.wins,
        kills: nums.kills,
        playTime: playTime.trim(),
      });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(errorText(err, "Не удалось отправить заявку."));
    }
  }

  return {
    gameNick,
    setGameNick,
    gameId,
    setGameId,
    rank,
    setRank,
    kd,
    setKd,
    matches,
    setMatches,
    wins,
    setWins,
    kills,
    setKills,
    playTime,
    setPlayTime,
    bad,
    winsOverMatches,
    valid,
    status,
    setStatus,
    error,
    onSubmit,
  };
}
