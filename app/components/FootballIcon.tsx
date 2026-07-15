"use client";

import type { ComponentType } from "react";
import {
  ArrowsLeftRight,
  Cards,
  ChartLineUp,
  Crosshair,
  FirstAid,
  FlagPennant,
  Gauge,
  Ranking,
  SoccerBall,
  Strategy,
  TrendUp,
  TShirt,
  UserCircleGear,
  UsersThree,
  Warning,
  Waveform,
} from "@phosphor-icons/react";

export type FootballIconName =
  | "goals"
  | "corners"
  | "cards"
  | "shots"
  | "form"
  | "standings"
  | "h2h"
  | "lineups"
  | "coach"
  | "absences"
  | "risk"
  | "signals"
  | "value"
  | "players";

const icons: Record<FootballIconName, ComponentType<{ size?: number; weight?: "regular" | "bold" | "duotone"; "aria-hidden"?: boolean }>> = {
  goals: SoccerBall,
  corners: FlagPennant,
  cards: Cards,
  shots: Crosshair,
  form: TrendUp,
  standings: Ranking,
  h2h: ArrowsLeftRight,
  lineups: TShirt,
  coach: UserCircleGear,
  absences: FirstAid,
  risk: Warning,
  signals: Waveform,
  value: Gauge,
  players: UsersThree,
};

export function FootballIcon({ name, size = 20, className = "" }: { name: FootballIconName; size?: number; className?: string }) {
  const Icon = icons[name] || Strategy || ChartLineUp;
  return <span className={`football-icon ${className}`} aria-hidden="true"><Icon size={size} weight="duotone" aria-hidden /></span>;
}

export function FootballCtaMotion() {
  return <span className="football-cta-motion" aria-hidden="true"><SoccerBall size={17} weight="duotone" /></span>;
}
