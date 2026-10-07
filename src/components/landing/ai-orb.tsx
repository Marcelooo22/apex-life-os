"use client";

/** Esfera de IA flotante: gradiente vivo estilo Siri / Apple Intelligence. */
export function AiOrb({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="ai-orb" onClick={onOpen} aria-label="Abrir el asistente de Apex">
      <span className="ai-blob b1" />
      <span className="ai-blob b2" />
      <span className="ai-blob b3" />
      <span className="ai-gloss" />
    </button>
  );
}
