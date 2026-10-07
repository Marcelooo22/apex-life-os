"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { useAppState } from "@/hooks/use-app-state";
import { WEEKDAYS } from "@/lib/constants";
import { parseKey } from "@/lib/dates";
import { PHASE_MINUTES, resetPomodoro, skipPomodoro, togglePomodoro } from "@/lib/pomodoro";
import { updateState } from "@/lib/store";
import { agendaFor, average, formatClock, formatGrade, gradeTone, monthCells, semesterProgress, subjectAverage, taskKind } from "@/lib/uni";
import { cn, pad, safeUrl } from "@/lib/utils";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useUniSheets } from "./use-uni-sheets";

/** Columna izquierda: avance del semestre y lista de asignaturas con su promedio. */
export function UniLeft({ today }: { today: string }) {
  const { uni } = useAppState();
  const sheets = useUniSheets();
  const sem = semesterProgress(uni.semester, today);
  const overall = average(uni.tasks);

  return (
    <>
      <section className="card">
        <div className="card-h">
          <h3>Semestre</h3>
          <button type="button" className="btn quiet sm" onClick={sheets.settings}>
            Ajustes
          </button>
        </div>
        {sem && uni.semester ? (
          <>
            <p className="u-sem">{uni.semester.name}</p>
            <ProgressBar value={sem.p} color="linear-gradient(90deg,#6366f1,#6aa3ff)" className="mb-2" />
            <p className="muted text-[13px]">
              {sem.ended ? "Semestre terminado" : sem.started ? `${Math.round(sem.p * 100)}% · quedan ${sem.daysLeft} días` : "Aún no empieza"}
            </p>
          </>
        ) : (
          <p className="muted text-[13px]">Define las fechas del semestre para ver cuánto llevas.</p>
        )}
        {overall && (
          <div className="u-avg">
            <span>Promedio general</span>
            <b data-tone={gradeTone(overall.value, uni.scale)}>
              {formatGrade(overall.value)}
              <small>/{uni.scale}</small>
            </b>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-h">
          <h3>Asignaturas</h3>
          <button type="button" className="icon-btn h-10 w-10 text-base" onClick={() => sheets.subject()} aria-label="Nueva asignatura">
            <Icon name="plus" />
          </button>
        </div>
        {uni.subjects.length === 0 && <div className="empty">Añade tus asignaturas y proyectos para organizarlos.</div>}
        <ul className="subj-list">
          {uni.subjects.map((s) => {
            const mine = uni.tasks.filter((t) => t.subject === s.id);
            const delivered = mine.filter((t) => t.status === "Entregado").length;
            const avg = subjectAverage(uni, s.id);
            const drive = safeUrl(s.drive);
            const notes = safeUrl(s.notes);
            return (
              <li key={s.id} className="subj">
                <div className="subj-h">
                  <button type="button" className="subj-n" onClick={() => sheets.subject(s.id)} aria-label={`Editar ${s.name}`}>
                    <strong>{s.name}</strong>
                    <small>
                      {s.kind} · {mine.length - delivered} {mine.length - delivered === 1 ? "pendiente" : "pendientes"}
                    </small>
                  </button>
                  <span className="grade" data-tone={avg ? gradeTone(avg.value, uni.scale) : "none"} title="Promedio acumulado">
                    {avg ? formatGrade(avg.value) : "—"}
                  </span>
                </div>
                <ProgressBar value={mine.length ? delivered / mine.length : 0} color="#6aa3ff" />
                {(drive || notes) && (
                  <div className="links">
                    {drive && (
                      <a className="lk" href={drive} target="_blank" rel="noopener noreferrer">
                        Drive <Icon name="link" />
                      </a>
                    )}
                    {notes && (
                      <a className="lk" href={notes} target="_blank" rel="noopener noreferrer">
                        Apuntes <Icon name="link" />
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/** Temporizador Pomodoro integrado. */
function Pomodoro({ today }: { today: string }) {
  const p = usePomodoro();
  const { uni } = useAppState();
  const seconds = Math.ceil(p.left / 1000);
  const label = { focus: "Enfoque", break: "Descanso corto", long: "Descanso largo" }[p.phase];
  const frac = p.total ? p.left / p.total : 1;
  const mins = uni.focus[today] ?? 0;
  return (
    <section className="card pomo" data-phase={p.phase}>
      <div className="card-h">
        <h3>Enfoque</h3>
        <span className="muted text-[13px]">{mins ? `${mins} min hoy` : "Pomodoro"}</span>
      </div>
      <div className="pomo-dial">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle className="t" cx="60" cy="60" r="52" />
          <circle className="p" cx="60" cy="60" r="52" pathLength={100} transform="rotate(-90 60 60)" style={{ strokeDasharray: `${frac * 100} 100` }} />
        </svg>
        <div className="pomo-c" role="timer" aria-label={`${label}: ${Math.floor(seconds / 60)} minutos y ${seconds % 60} segundos`}>
          <b>
            {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
          </b>
          <span>{label}</span>
        </div>
      </div>
      <div className="pomo-b">
        <button type="button" className="icon-btn" onClick={resetPomodoro} aria-label="Reiniciar">
          <Icon name="reset" />
        </button>
        <button type="button" className="pomo-play" onClick={togglePomodoro} aria-label={p.running ? "Pausar" : "Empezar"}>
          <Icon name={p.running ? "pause" : "play"} />
        </button>
        <button type="button" className="icon-btn" onClick={skipPomodoro} aria-label="Saltar fase">
          <Icon name="skip" />
        </button>
      </div>
      <div className="pomo-r" aria-label={`${p.round} de 4 enfoques`}>
        {[0, 1, 2, 3].map((i) => (
          <i key={i} className={cn(i < p.round && "on")} />
        ))}
        <small>
          {PHASE_MINUTES.focus}/{PHASE_MINUTES.break} min
        </small>
      </div>
    </section>
  );
}

/** Columna derecha: calendario con la agenda del día, Pomodoro y notas rápidas. */
export function UniRight({ today }: { today: string }) {
  const state = useAppState();
  const { uni } = state;
  const sheets = useUniSheets();
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked ?? today;
  const base = parseKey(today);
  const first = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const cells = monthCells(first.getFullYear(), first.getMonth());
  const exams = new Set(uni.tasks.filter((t) => taskKind(t) === "Parcial" && t.status !== "Entregado").map((t) => t.due));
  const dues = new Set(uni.tasks.filter((t) => t.status !== "Entregado").map((t) => t.due));
  const agenda = agendaFor(state, selected);
  const longDay = parseKey(selected).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <section className="card">
        <div className="cal-nav u-cal-nav">
          <button type="button" onClick={() => setOffset(offset - 1)} aria-label="Mes anterior">
            <Icon name="left" />
          </button>
          <strong>{first.toLocaleDateString("es", { month: "long", year: "numeric" })}</strong>
          <button type="button" onClick={() => setOffset(offset + 1)} aria-label="Mes siguiente">
            <Icon name="right" />
          </button>
        </div>
        <div className="cal-h" aria-hidden="true">
          {WEEKDAYS.map((d) => (
            <span key={d.long}>{d.short}</span>
          ))}
        </div>
        <div className="cal u-cal">
          {cells.map((key, i) =>
            key ? (
              <button
                key={key}
                type="button"
                className={cn("ud", exams.has(key) && "exam", dues.has(key) && "due", key === today && "today", key === selected && "sel")}
                onClick={() => setPicked(key)}
                aria-pressed={key === selected}
                aria-label={`${Number(key.slice(8))}${exams.has(key) ? ", examen" : dues.has(key) ? ", entrega" : ""}`}
              >
                {Number(key.slice(8))}
              </button>
            ) : (
              <span key={`b${i}`} />
            ),
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-h">
          <h3 className="cap">{longDay}</h3>
          <button type="button" className="icon-btn h-10 w-10 text-base" onClick={() => sheets.task(undefined, { due: selected })} aria-label="Añadir evaluación este día">
            <Icon name="plus" />
          </button>
        </div>
        {agenda.length === 0 ? (
          <p className="muted text-[13px]">Nada programado este día.</p>
        ) : (
          <ul className="agenda">
            {agenda.map((a) => (
              <li key={a.id} data-kind={a.kind} className={cn(a.done && "done", a.clash && "clash")}>
                <time>{a.start === null ? "Todo el día" : formatClock(a.start)}</time>
                <span>
                  <strong>{a.title}</strong>
                  <small>
                    {a.detail}
                    {a.start !== null && a.kind !== "habit" ? `, ${a.mins} min` : ""}
                  </small>
                  {a.clash && <em>Se solapa con otro bloque</em>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Pomodoro today={today} />

      <section className="card">
        <div className="card-h">
          <h3>Notas rápidas</h3>
        </div>
        <textarea
          className="notes"
          aria-label="Notas rápidas"
          placeholder="Ideas, dudas para la próxima clase…"
          value={uni.notes}
          onChange={(e) =>
            updateState((d) => {
              d.uni.notes = e.target.value.slice(0, 4000);
            })
          }
        />
      </section>
    </>
  );
}

