"use client";

import { useState } from "react";
import { Icon, isIconName } from "@/components/ui/icon";
import { useAppState } from "@/hooks/use-app-state";
import { useNavigation } from "@/hooks/use-navigation";
import { useToday } from "@/hooks/use-time-key";
import { longDate } from "@/lib/dates";
import { hexToRgb } from "@/lib/custom";
import { landingMetrics } from "@/lib/metrics";
import { AiOrb } from "./ai-orb";
import { AssistantSheet } from "./assistant-sheet";
import { Orb, type OrbConfig } from "./orb";
import { useSettingsSheet } from "./settings-sheet";

const ORBS: readonly OrbConfig[] = [
  { id: "gym", label: "Gym", icon: "dumbbell", color: "#ff6a2b", rgb: "255,106,43" },
  { id: "habits", label: "Hábitos", icon: "habits", color: "#34f5a4", rgb: "52,245,164" },
  { id: "nutrition", label: "Nutrición", icon: "nutrition", color: "#22d3ee", rgb: "34,211,238" },
  { id: "hobbies", label: "Hobbies", icon: "music", color: "#c084fc", rgb: "192,132,252" },
  { id: "uni", label: "Universidad", icon: "uni", color: "#4f8dff", rgb: "79,141,255" },
];

const greeting = (hour: number) => (hour < 6 ? "Buenas noches" : hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches");

/** Pantalla de inicio: saludo, burbujas hacia cada sección y la esfera del asistente. */
export function Landing() {
  const state = useAppState();
  const { hour } = useToday();
  const { view, open } = useNavigation();
  const openSettings = useSettingsSheet();
  const [assistant, setAssistant] = useState(false);
  const metrics = landingMetrics(state);
  const customOrbs: OrbConfig[] = state.custom.map((m) => ({
    id: m.id,
    label: m.name,
    icon: isIconName(m.icon) ? m.icon : "star",
    color: m.color,
    rgb: hexToRgb(m.color),
  }));

  return (
    <main id="landing" className="landing" data-theme="none" inert={view !== null}>
      <div className="l-top">
        <button type="button" className="icon-btn" onClick={openSettings} aria-label="Ajustes y copia de seguridad">
          <Icon name="sliders" />
        </button>
      </div>
      <header className="l-head">
        <p className="l-date">{longDate()}</p>
        <h1>
          {greeting(hour)}
          {state.name ? `, ${state.name}` : ""}
        </h1>
        <p className="l-sub">¿A dónde vas hoy?</p>
      </header>
      <nav className="orbs" aria-label="Secciones">
        {[...ORBS, ...customOrbs].map((orb) => (
          <Orb key={orb.id} {...orb} metric={metrics[orb.id] ?? { p: 0, t: "" }} onOpen={open} />
        ))}
      </nav>
      <AiOrb onOpen={() => setAssistant(true)} />
      {assistant && <AssistantSheet onClose={() => setAssistant(false)} />}
    </main>
  );
}
