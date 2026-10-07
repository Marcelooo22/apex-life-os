"use client";

import { ViewShell } from "@/components/layout/view-shell";
import { useSheet } from "@/components/ui/sheet-provider";
import { useNavigation } from "@/hooks/use-navigation";
import { useToday } from "@/hooks/use-time-key";
import { CUSTOM_COLORS, CUSTOM_ICONS } from "@/lib/constants";
import { clean, normalizeColor, TEMPLATE_LABEL } from "@/lib/custom";
import { updateState } from "@/lib/store";
import type { CustomModule } from "@/lib/types";
import { num } from "@/lib/utils";
import { ChecklistView, CounterView, JournalView, LedgerView } from "./templates";
import { editModule, useCustomModule } from "./use-custom";

const COLOR_NAMES: Record<string, string> = { rose: "Rosa", gold: "Dorado", lime: "Lima", teal: "Turquesa", sky: "Cielo", indigo: "Índigo", pink: "Fucsia", sand: "Arena" };

/** Vista de un módulo creado por el asistente. */
export function CustomView({ id }: { id: string }) {
  const m = useCustomModule(id);
  const { today } = useToday();
  const { openSheet, closeSheet, confirm } = useSheet();
  const { back } = useNavigation();
  if (!m) return null;

  const settings = (mod: CustomModule) =>
    openSheet({
      title: "Ajustes del panel",
      submit: "Guardar",
      focus: false,
      fields: [
        { name: "name", label: "Nombre", type: "text", required: true, value: mod.name },
        ...(mod.template === "counter"
          ? ([
              { name: "goal", label: "Meta diaria", type: "number", half: true, value: mod.goal },
              { name: "unit", label: "Unidad", type: "text", half: true, value: mod.unit, placeholder: "páginas, vasos…" },
            ] as const)
          : []),
        ...(mod.template === "ledger" ? ([{ name: "currency", label: "Moneda", type: "text", half: true, value: mod.currency }] as const) : []),
        { name: "color", label: "Color", type: "select", options: CUSTOM_COLORS.map((c) => [c.hex, COLOR_NAMES[c.id] ?? c.id] as const), value: mod.color },
        { name: "icon", label: "Icono", type: "select", options: CUSTOM_ICONS.map((i) => [i, i] as const), value: mod.icon },
      ],
      text: TEMPLATE_LABEL[mod.template],
      danger: {
        label: "Eliminar panel",
        fn: () => {
          closeSheet();
          confirm("¿Eliminar este panel?", `"${mod.name}" y todos sus datos se borrarán.`, "Eliminar", () => {
            back();
            setTimeout(() => updateState((d) => void (d.custom = d.custom.filter((x) => x.id !== mod.id))), 700);
          });
        },
      },
      onSubmit: (v) =>
        editModule(mod.id, (x) => {
          x.name = clean(v.name, 28) || x.name;
          x.color = normalizeColor(v.color, x.color);
          if (CUSTOM_ICONS.includes(v.icon as never)) x.icon = v.icon!;
          if (x.template === "counter") {
            x.goal = Math.max(1, Math.round(num(v.goal)) || x.goal);
            x.unit = clean(v.unit, 14);
          }
          if (x.template === "ledger") x.currency = clean(v.currency, 4) || x.currency;
        }),
    });

  return (
    <ViewShell title={m.name} subtitle={m.description} action={{ label: "Ajustes del panel", onClick: () => settings(m) }}>
      {m.template === "checklist" && <ChecklistView module={m} today={today} />}
      {m.template === "counter" && <CounterView module={m} today={today} />}
      {m.template === "ledger" && <LedgerView module={m} today={today} />}
      {m.template === "journal" && <JournalView module={m} today={today} />}
    </ViewShell>
  );
}
