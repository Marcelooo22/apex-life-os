import type { HabitCategory, Slot } from "./types";

export interface HabitIdea {
  name: string;
  slot: Slot;
}

/** Hábitos comunes por categoría: se eligen con un toque y solo falta decidir los días y la hora. */
export const HABIT_IDEAS: Record<HabitCategory, HabitIdea[]> = {
  health: [
    { name: "Beber 2 litros de agua", slot: "morning" },
    { name: "Tomar mis vitaminas", slot: "morning" },
    { name: "Comer una fruta", slot: "afternoon" },
    { name: "Caminar 30 minutos", slot: "afternoon" },
    { name: "Estirar 10 minutos", slot: "morning" },
    { name: "Dormir 8 horas", slot: "night" },
    { name: "Usar hilo dental", slot: "night" },
    { name: "Acostarme antes de las 11 pm", slot: "night" },
  ],
  mind: [
    { name: "Meditar 10 minutos", slot: "morning" },
    { name: "Escribir en mi diario", slot: "night" },
    { name: "Respirar profundo 5 minutos", slot: "afternoon" },
    { name: "Agradecer 3 cosas del día", slot: "night" },
    { name: "Una hora sin redes sociales", slot: "afternoon" },
    { name: "Planear mi día", slot: "morning" },
    { name: "Dejar el celular antes de dormir", slot: "night" },
    { name: "Leer 10 páginas", slot: "night" },
  ],
  body: [
    { name: "Ir al gym", slot: "afternoon" },
    { name: "Hacer 50 flexiones", slot: "morning" },
    { name: "Trotar 20 minutos", slot: "morning" },
    { name: "Plancha de 1 minuto", slot: "morning" },
    { name: "Caminar 10.000 pasos", slot: "afternoon" },
    { name: "Yoga 15 minutos", slot: "night" },
    { name: "Subir por las escaleras", slot: "afternoon" },
    { name: "Estirar al despertar", slot: "morning" },
  ],
  learning: [
    { name: "Estudiar 1 hora", slot: "afternoon" },
    { name: "Repasar mis apuntes", slot: "night" },
    { name: "Practicar inglés 15 minutos", slot: "morning" },
    { name: "Practicar mi instrumento 20 minutos", slot: "afternoon" },
    { name: "Avanzar en un curso en línea", slot: "night" },
    { name: "Leer 20 páginas", slot: "night" },
    { name: "Repasar tarjetas de estudio", slot: "afternoon" },
    { name: "Ver una clase o tutorial", slot: "afternoon" },
  ],
  work: [
    { name: "Revisar mis pendientes del día", slot: "morning" },
    { name: "Bloque de trabajo profundo (90 min)", slot: "morning" },
    { name: "Responder correos pendientes", slot: "afternoon" },
    { name: "Planear la semana", slot: "morning" },
    { name: "Ordenar mi escritorio", slot: "night" },
    { name: "Pausa activa cada hora", slot: "afternoon" },
    { name: "Cerrar el día con un resumen", slot: "night" },
    { name: "Revisar mis metas del mes", slot: "morning" },
  ],
  social: [
    { name: "Llamar a un familiar", slot: "afternoon" },
    { name: "Escribirle a un amigo", slot: "afternoon" },
    { name: "Hacer un plan en persona", slot: "night" },
    { name: "Dar las gracias a alguien", slot: "morning" },
    { name: "Tener un detalle con alguien", slot: "afternoon" },
    { name: "Responder mis mensajes", slot: "night" },
    { name: "Cenar en familia", slot: "night" },
    { name: "Conocer a alguien nuevo", slot: "afternoon" },
  ],
  home: [
    { name: "Hacer la cama", slot: "morning" },
    { name: "Lavar los platos", slot: "night" },
    { name: "Ordenar 10 minutos", slot: "afternoon" },
    { name: "Sacar la basura", slot: "night" },
    { name: "Regar las plantas", slot: "morning" },
    { name: "Preparar el almuerzo de mañana", slot: "night" },
    { name: "Lavar la ropa", slot: "afternoon" },
    { name: "Limpiar la cocina", slot: "night" },
  ],
  money: [
    { name: "Anotar mis gastos del día", slot: "night" },
    { name: "Revisar mi presupuesto", slot: "morning" },
    { name: "Ahorrar un poco", slot: "morning" },
    { name: "No comprar por impulso", slot: "afternoon" },
    { name: "Revisar mis cuentas", slot: "night" },
    { name: "Pagar facturas a tiempo", slot: "morning" },
    { name: "Revisar mis suscripciones", slot: "afternoon" },
    { name: "Invertir lo que planeé este mes", slot: "morning" },
  ],
};
