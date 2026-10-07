"use client";

/** Esfera de IA flotante: gradiente vivo estilo Siri / Apple Intelligence. */
export function AiOrb({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="ai-orb" onClick={onOpen} aria-label="Abrir el asistente de Apex">
      <span className="orb-core">
        <i className="ai-blob b1" />
        <i className="ai-blob b2" />
        <i className="ai-blob b3" />
        <i className="ai-gloss" />
      </span>
    </button>
  );
}
