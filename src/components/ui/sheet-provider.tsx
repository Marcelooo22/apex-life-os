"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { WEEKDAYS } from "@/lib/constants";
import { prefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useNavigation } from "@/hooks/use-navigation";
import type { Theme } from "@/lib/types";
import { themeVars } from "@/lib/theme";
import { cn, haptic } from "@/lib/utils";

/* ===================== Configuración de campos ===================== */
interface BaseField {
  name: string;
  label: string;
  half?: boolean;
  required?: boolean;
  value?: string | number | null;
  placeholder?: string;
}

type OptionList = readonly (readonly [string, string])[];
type IconOptionList = readonly (readonly [string, string, IconName])[];

export type FieldConfig =
  | (BaseField & { type: "text" | "number" | "url" | "date"; list?: readonly string[] })
  | (BaseField & { type: "textarea" })
  | (BaseField & { type: "select"; options: OptionList })
  | (BaseField & { type: "seg"; options: OptionList })
  /** Hora con selector nativo (rueda en iOS). Valor "HH:MM" o vacío. */
  | (BaseField & { type: "time"; clearLabel?: string })
  /** Días de la semana L M X J V S D. El valor son los índices separados por comas ("0,1,4"). */
  | (BaseField & { type: "days" })
  /** Cuadrícula de opciones con icono. */
  | (BaseField & { type: "choice"; options: IconOptionList })
  /** Contenido propio; debe incluir un input con `name` para que su valor llegue al formulario. */
  | (BaseField & { type: "custom"; render: () => ReactNode });

export interface SheetConfig {
  title: string;
  text?: string;
  fields?: readonly FieldConfig[];
  /** Contenido libre debajo de los campos (botones extra, listas…). */
  children?: ReactNode;
  /** Contenido justo debajo del título (una ficha, una imagen…). */
  header?: ReactNode;
  /** Contenido justo encima del botón principal (avisos, sugerencias…). */
  footer?: ReactNode;
  /** Texto del botón principal. Si falta, solo se muestra "Cerrar". */
  submit?: string;
  danger?: { label: string; fn: () => void };
  /** Tema de color. Por defecto el de la sección abierta. */
  theme?: Theme;
  /** false para no enfocar el primer campo al abrir. */
  focus?: boolean;
  /** Devuelve `false` para mantener la hoja abierta. */
  onSubmit?: (values: Record<string, string>) => void | false;
  /** Se llama en cada cambio de un campo (autocompletado, etc.). */
  onFieldInput?: (form: HTMLFormElement, target: HTMLElement) => void;
}

interface SheetApi {
  openSheet: (config: SheetConfig) => void;
  closeSheet: (instant?: boolean) => void;
  /** Hoja de confirmación ("¿Eliminar…?"). */
  confirm: (title: string, text: string, label: string, onConfirm: () => void) => void;
}

const SheetContext = createContext<SheetApi | null>(null);

export function useSheet(): SheetApi {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheet debe usarse dentro de <SheetProvider>");
  return ctx;
}

/* ===================== Proveedor ===================== */
export function SheetProvider({ children }: { children: ReactNode }) {
  const { view } = useNavigation();
  const [sheet, setSheet] = useState<{ config: SheetConfig; key: number } | null>(null);
  const [open, setOpen] = useState(false);
  const counter = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const frames = useRef<number[]>([]);

  const cancelPending = () => {
    clearTimeout(closeTimer.current);
    frames.current.forEach(cancelAnimationFrame);
    frames.current = [];
  };

  const openSheet = useCallback((config: SheetConfig) => {
    cancelPending();
    counter.current += 1;
    setSheet({ config, key: counter.current });
    setOpen(false);
    // Dos frames para que el navegador pinte el estado cerrado y la transición sea visible.
    frames.current = [
      requestAnimationFrame(() => {
        frames.current = [requestAnimationFrame(() => setOpen(true))];
      }),
    ];
  }, []);

  const closeSheet = useCallback((instant?: boolean) => {
    cancelPending();
    setOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    closeTimer.current = setTimeout(() => setSheet(null), instant || prefersReducedMotion() ? 0 : 420);
  }, []);

  const confirm = useCallback<SheetApi["confirm"]>(
    (title, text, label, onConfirm) => {
      openSheet({ title, text, submit: label, focus: false, onSubmit: () => onConfirm() });
    },
    [openSheet],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    const onPop = () => closeSheet(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      cancelPending();
    };
  }, [closeSheet]);

  const api = useMemo(() => ({ openSheet, closeSheet, confirm }), [openSheet, closeSheet, confirm]);

  return (
    <SheetContext.Provider value={api}>
      {children}
      {sheet && (
        <SheetView
          key={sheet.key}
          config={sheet.config}
          open={open}
          theme={sheet.config.theme ?? view ?? "none"}
          onClose={() => closeSheet()}
        />
      )}
    </SheetContext.Provider>
  );
}

/* ===================== Vista de la hoja ===================== */
function SheetView({ config, open, theme, onClose }: { config: SheetConfig; open: boolean; theme: Theme; onClose: () => void }) {
  const { closeSheet } = useSheet();
  const formRef = useRef<HTMLFormElement>(null);
  const titleId = useId();
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());
  const fields = config.fields ?? [];

  useEffect(() => {
    if (config.focus === false) return;
    const t = setTimeout(() => {
      formRef.current?.querySelector<HTMLElement>(".fld input[type=text], .fld textarea")?.focus({ preventScroll: true });
    }, 380);
    return () => clearTimeout(t);
  }, [config.focus]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config.onSubmit) return closeSheet();

    const data = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    const missing = new Set<string>();
    for (const f of fields) {
      values[f.name] = f.type === "days" ? data.getAll(f.name).map(String).join(",") : String(data.get(f.name) ?? "");
      if (f.required && !values[f.name]?.trim()) missing.add(f.name);
    }
    setInvalid(missing);
    const first = fields.find((f) => missing.has(f.name));
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first.name}"]`)?.focus();
      haptic(30);
      return;
    }
    if (config.onSubmit(values) !== false) closeSheet();
  };

  return (
    <div className={cn("sheet", open && "open")}>
      <div className="sheet-back" onClick={onClose} />
      <form
        ref={formRef}
        className="sheet-panel"
        data-theme={theme}
        style={themeVars(theme)}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        onInput={(e) => config.onFieldInput?.(e.currentTarget, e.target as HTMLElement)}
      >
        <div className="grab" />
        <h2 id={titleId}>{config.title}</h2>
        {config.text && <p className="txt">{config.text}</p>}
        {config.header}
        {fields.length > 0 && (
          <div className="fields">
            {fields.map((f) => (
              <Field key={f.name} field={f} invalid={invalid.has(f.name)} />
            ))}
          </div>
        )}
        {config.children}
        {config.footer}
        <div className="sheet-actions">
          {config.submit && (
            <button className="btn primary big" type="submit">
              {config.submit}
            </button>
          )}
          <div className="row2">
            <button type="button" className="btn quiet" onClick={onClose}>
              {config.submit ? "Cancelar" : "Cerrar"}
            </button>
            {config.danger && (
              <button type="button" className="btn danger" onClick={config.danger.fn}>
                {config.danger.label}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

/* ===================== Campos ===================== */
function Field({ field, invalid }: { field: FieldConfig; invalid: boolean }) {
  const id = `f-${field.name}`;
  const value = String(field.value ?? "");
  const wrapper = cn("fld", field.half && "half", invalid && "bad");

  if (field.type === "seg") {
    return (
      <div className={wrapper}>
        <span className="fl">{field.label}</span>
        <div className="seg-f" role="radiogroup" aria-label={field.label}>
          {field.options.map(([optionValue, optionLabel]) => (
            <label key={optionValue}>
              <input type="radio" name={field.name} value={optionValue} defaultChecked={optionValue === value} />
              <span>{optionLabel}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "days") {
    const selected = new Set(value.split(",").filter(Boolean));
    return (
      <div className={wrapper}>
        <span className="fl">{field.label}</span>
        <div className="days-f" role="group" aria-label={field.label}>
          {WEEKDAYS.map((day, i) => (
            <label key={day.long} title={day.long}>
              <input type="checkbox" name={field.name} value={i} defaultChecked={selected.has(String(i))} aria-label={day.long} />
              <span aria-hidden="true">{day.short}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "choice") {
    return (
      <div className={wrapper}>
        <span className="fl">{field.label}</span>
        <div className="choice-f" role="radiogroup" aria-label={field.label}>
          {field.options.map(([optionValue, optionLabel, icon]) => (
            <label key={optionValue}>
              <input type="radio" name={field.name} value={optionValue} defaultChecked={optionValue === value} />
              <span>
                <Icon name={icon} />
                {optionLabel}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "time") return <TimeField field={field} id={id} wrapper={wrapper} />;

  if (field.type === "custom") {
    return (
      <div className={wrapper}>
        <span className="fl">{field.label}</span>
        {field.render()}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={wrapper}>
        <label htmlFor={id}>{field.label}</label>
        <select id={id} name={field.name} defaultValue={value}>
          {field.options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className={wrapper}>
        <label htmlFor={id}>{field.label}</label>
        <textarea id={id} name={field.name} defaultValue={value} placeholder={field.placeholder ?? ""} />
      </div>
    );
  }

  const inputType = field.type === "date" ? "date" : field.type === "url" ? "url" : "text";
  const inputMode = field.type === "number" ? "decimal" : field.type === "url" ? "url" : "text";
  const listId = field.list ? `dl-${field.name}` : undefined;
  return (
    <div className={wrapper}>
      <label htmlFor={id}>{field.label}</label>
      <input
        id={id}
        name={field.name}
        type={inputType}
        inputMode={inputMode}
        defaultValue={value}
        placeholder={field.placeholder ?? ""}
        autoComplete="off"
        list={listId}
      />
      {field.list && listId && (
        <datalist id={listId}>
          {field.list.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      )}
    </div>
  );
}

/** Hora con el selector nativo del dispositivo y un botón para quitarla. */
function TimeField({ field, id, wrapper }: { field: Extract<FieldConfig, { type: "time" }>; id: string; wrapper: string }) {
  const [time, setTime] = useState(String(field.value ?? ""));
  return (
    <div className={wrapper}>
      <label htmlFor={id}>{field.label}</label>
      <div className="time-f">
        <input id={id} name={field.name} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        {time && (
          <button type="button" className="btn quiet sm" onClick={() => setTime("")}>
            {field.clearLabel ?? "Quitar"}
          </button>
        )}
      </div>
    </div>
  );
}
