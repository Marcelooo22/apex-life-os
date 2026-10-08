"use client";

import dynamic from "next/dynamic";

/** El dibujo anatómico pesa ~130 KB, así que se descarga solo cuando se necesita. */
export const AnatomyLazy = dynamic(() => import("./anatomy").then((m) => m.Anatomy), {
  ssr: false,
  loading: () => <div className="anat anat-sk" aria-hidden="true" />,
});
