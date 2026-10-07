/** Zonas del cuerpo (más finas que los grupos del radar). */
export type Zone =
  | "pecho" | "hombros" | "biceps" | "triceps" | "antebrazos" | "abdomen" | "oblicuos"
  | "dorsales" | "trapecio" | "lumbar" | "gluteos" | "cuadriceps" | "isquios" | "gemelos";

export type Muscle = "Pecho" | "Espalda" | "Hombros" | "Bíceps" | "Tríceps" | "Piernas" | "Core";

export const ZONE_LABEL: Record<Zone, string> = {
  pecho: "Pecho", hombros: "Hombros", biceps: "Bíceps", triceps: "Tríceps", antebrazos: "Antebrazos", abdomen: "Abdomen",
  oblicuos: "Oblicuos", dorsales: "Dorsales", trapecio: "Trapecio", lumbar: "Lumbar", gluteos: "Glúteos",
  cuadriceps: "Cuádriceps", isquios: "Isquiotibiales", gemelos: "Gemelos",
};

export const ZONE_MUSCLE: Record<Zone, Muscle> = {
  pecho: "Pecho", hombros: "Hombros", biceps: "Bíceps", triceps: "Tríceps", antebrazos: "Bíceps", abdomen: "Core", oblicuos: "Core",
  dorsales: "Espalda", trapecio: "Espalda", lumbar: "Espalda", gluteos: "Piernas", cuadriceps: "Piernas", isquios: "Piernas", gemelos: "Piernas",
};

/** Zonas grandes tardan más en recuperarse. */
export const LARGE_ZONES: readonly Zone[] = ["pecho", "dorsales", "gluteos", "cuadriceps", "isquios", "lumbar"];

export type Equip = "Barra" | "Mancuernas" | "Máquina" | "Polea" | "Peso corporal" | "Otro";

export interface Exercise {
  id: string;
  name: string;
  /** Zonas trabajadas; la primera es la principal. */
  zones: Zone[];
  equip: Equip;
  /** Se hace con el peso del cuerpo (no hace falta anotar kg). */
  bw?: boolean;
  /** Otros nombres con los que la gente lo conoce. */
  alias?: string[];
  /** 3 pasos: posición, movimiento y qué cuidar. */
  how: [string, string, string];
}

const e = (id: string, name: string, equip: Equip, zones: Zone[], how: [string, string, string], extra: { bw?: boolean; alias?: string[] } = {}): Exercise => ({ id, name, equip, zones, how, ...extra });

export const EXERCISES: readonly Exercise[] = [
  // ----- Pecho
  e("press-banca", "Press banca con barra", "Barra", ["pecho", "triceps", "hombros"], ["Tumbado en el banco, pies firmes en el suelo y omóplatos juntos hacia atrás. Agarra la barra un poco más ancho que los hombros.", "Baja la barra de forma controlada hasta rozar la parte media del pecho y empújala hacia arriba hasta estirar los brazos.", "Mantén las muñecas rectas y los codos a unos 45° del cuerpo, no abiertos del todo. No rebotes la barra en el pecho."], { alias: ["Press banca", "Banca plana", "Bench press"] }),
  e("press-banca-inclinado", "Press inclinado con barra", "Barra", ["pecho", "hombros", "triceps"], ["Banco inclinado entre 30° y 45°. Omóplatos atrás y pies firmes.", "Baja la barra hacia la parte alta del pecho y empuja en línea recta hacia arriba.", "Con más de 45° trabaja más el hombro que el pecho. Controla la bajada."]),
  e("press-mancuernas", "Press con mancuernas", "Mancuernas", ["pecho", "triceps", "hombros"], ["Tumbado en banco plano con una mancuerna en cada mano a la altura del pecho.", "Empuja hacia arriba juntando ligeramente las mancuernas y baja hasta sentir estiramiento en el pecho.", "Baja despacio y no dejes caer los codos por debajo del banco con demasiada fuerza."], { alias: ["Press banca con mancuernas"] }),
  e("press-inclinado-mancuernas", "Press inclinado con mancuernas", "Mancuernas", ["pecho", "hombros", "triceps"], ["Banco a 30°–45°, mancuernas a los lados del pecho alto.", "Empuja hacia arriba y ligeramente hacia dentro; baja controlando hasta sentir el pecho estirado.", "Evita arquear mucho la espalda; mantén los pies en el suelo."]),
  e("aperturas", "Aperturas con mancuernas", "Mancuernas", ["pecho"], ["Tumbado en banco plano, brazos arriba con las mancuernas y codos ligeramente flexionados.", "Abre los brazos en arco hasta sentir estirar el pecho y vuelve juntando como si abrazaras un árbol.", "Usa poco peso: es un ejercicio de estiramiento, no de fuerza. Los codos se quedan semiflexionados todo el recorrido."], { alias: ["Aperturas", "Vuelos de pecho"] }),
  e("cruce-poleas", "Cruce de poleas", "Polea", ["pecho"], ["De pie entre dos poleas altas, un paso adelante y el torso ligeramente inclinado.", "Lleva las manos hacia el centro, delante del pecho, apretando al juntarlas.", "Mantén los codos con una pequeña flexión fija y evita balancear el cuerpo."], { alias: ["Cruces en polea", "Crossover"] }),
  e("fondos", "Fondos en paralelas", "Peso corporal", ["pecho", "triceps", "hombros"], ["Agarra las paralelas con los brazos estirados y el cuerpo ligeramente inclinado hacia delante.", "Baja doblando los codos hasta que los hombros queden cerca de las manos y sube empujando.", "Inclinado trabaja más el pecho; recto, más el tríceps. Si te cuesta, usa la máquina asistida."], { bw: true, alias: ["Fondos"] }),
  e("flexiones", "Flexiones", "Peso corporal", ["pecho", "triceps", "hombros"], ["Manos un poco más anchas que los hombros, cuerpo recto de cabeza a talones.", "Baja el pecho hasta casi tocar el suelo y empuja hasta estirar los brazos.", "No hundas la cadera ni subas el culo. Si es muy difícil, apoya las rodillas."], { bw: true, alias: ["Push ups", "Lagartijas"] }),
  e("press-pecho-maquina", "Press de pecho en máquina", "Máquina", ["pecho", "triceps"], ["Ajusta el asiento para que las asas queden a la altura del pecho. Espalda pegada al respaldo.", "Empuja hacia delante hasta casi estirar los brazos y vuelve despacio.", "No despegues la espalda del respaldo. Ideal para empezar."]),
  e("peck-deck", "Peck deck (contractora)", "Máquina", ["pecho"], ["Siéntate con la espalda pegada y los antebrazos o manos en las almohadillas.", "Junta los brazos delante del pecho apretando y vuelve abriendo con control.", "No lleves los codos demasiado atrás: protege el hombro."], { alias: ["Contractora", "Pec deck"] }),
  // ----- Hombros
  e("press-militar", "Press militar con barra", "Barra", ["hombros", "triceps"], ["De pie, barra a la altura de la clavícula, glúteos y abdomen apretados.", "Empuja la barra hacia arriba pasando la cabeza y termina con los brazos estirados sobre ti.", "No arquees la zona lumbar. Mueve la cabeza hacia atrás un momento para dejar pasar la barra."], { alias: ["Press militar", "Press de hombro"] }),
  e("press-hombro-mancuernas", "Press de hombro con mancuernas", "Mancuernas", ["hombros", "triceps"], ["Sentado con la espalda apoyada, mancuernas a la altura de las orejas.", "Empuja hacia arriba hasta casi juntarlas y baja con control.", "No bloquees los codos arriba ni arquees la espalda."], { alias: ["Press hombro", "Press con mancuernas sentado"] }),
  e("press-arnold", "Press Arnold", "Mancuernas", ["hombros", "triceps"], ["Sentado, mancuernas delante del pecho con las palmas hacia ti.", "Sube girando las palmas hacia fuera hasta extender los brazos y baja deshaciendo el giro.", "Movimiento lento y fluido; usa menos peso que en el press normal."]),
  e("elevaciones-laterales", "Elevaciones laterales", "Mancuernas", ["hombros"], ["De pie con una mancuerna en cada mano a los lados y una ligera flexión de codos.", "Sube los brazos hacia los lados hasta la altura de los hombros, como si vertieras agua de una jarra, y baja despacio.", "Usa poco peso y no balancees el cuerpo. No subas por encima de los hombros."], { alias: ["Laterales", "Vuelos laterales"] }),
  e("elevaciones-frontales", "Elevaciones frontales", "Mancuernas", ["hombros"], ["De pie, mancuernas delante de los muslos.", "Sube un brazo (o los dos) hacia delante hasta la altura del hombro y baja controlando.", "Sin impulso con la espalda. Poco peso."]),
  e("pajaros", "Pájaros (vuelos posteriores)", "Mancuernas", ["hombros", "trapecio"], ["Inclínate hacia delante con la espalda recta y las mancuernas colgando.", "Abre los brazos hacia los lados apretando los omóplatos y baja despacio.", "Es para el hombro posterior: poco peso y mucho control."], { alias: ["Vuelos posteriores", "Pájaros"] }),
  e("face-pull", "Face pull", "Polea", ["hombros", "trapecio"], ["Polea a la altura de la cara con cuerda. Agarra los extremos y da un paso atrás.", "Tira hacia la cara separando las manos y llevando los codos hacia atrás y arriba.", "Excelente para la postura y la salud del hombro. Peso ligero, movimiento limpio."]),
  e("press-hombro-maquina", "Press de hombro en máquina", "Máquina", ["hombros", "triceps"], ["Ajusta el asiento para que las asas queden a la altura de los hombros.", "Empuja hacia arriba sin bloquear los codos y baja con control.", "Espalda pegada al respaldo."]),
  // ----- Tríceps
  e("triceps-polea", "Extensión de tríceps en polea", "Polea", ["triceps"], ["De pie frente a la polea alta, codos pegados a las costillas.", "Empuja la barra o cuerda hacia abajo hasta estirar los brazos y sube controlando.", "Solo se mueven los antebrazos; los codos no se despegan del cuerpo."], { alias: ["Extensión de tríceps", "Jalón de tríceps", "Pushdown"] }),
  e("press-frances", "Press francés", "Barra", ["triceps"], ["Tumbado en banco con una barra EZ sobre el pecho y brazos estirados.", "Dobla solo los codos para bajar la barra hacia la frente y vuelve a estirar.", "Los codos apuntan al techo y no se abren. Empieza con poco peso."], { alias: ["Rompecráneos", "Skull crusher"] }),
  e("fondos-banco", "Fondos en banco", "Peso corporal", ["triceps", "hombros"], ["Manos en el borde de un banco detrás de ti, piernas estiradas o dobladas.", "Baja doblando los codos hacia atrás hasta unos 90° y sube.", "Mantén la espalda cerca del banco. Si te duele el hombro, no bajes tanto."], { bw: true }),
  e("patada-triceps", "Patada de tríceps", "Mancuernas", ["triceps"], ["Inclinado hacia delante con el codo pegado al cuerpo y la mancuerna en la mano.", "Estira el brazo hacia atrás apretando el tríceps y vuelve despacio.", "El brazo superior queda quieto. Peso ligero."]),
  e("triceps-cabeza", "Extensión de tríceps sobre la cabeza", "Mancuernas", ["triceps"], ["Sujeta una mancuerna con las dos manos sobre la cabeza.", "Baja la mancuerna detrás de la nuca doblando los codos y sube estirando.", "Codos cerrados apuntando al techo; no arquees la espalda."], { alias: ["Press tras nuca", "Copa de tríceps"] }),
  e("press-cerrado", "Press banca agarre cerrado", "Barra", ["triceps", "pecho"], ["Como el press banca pero con las manos al ancho de los hombros.", "Baja la barra a la parte baja del pecho con los codos pegados al cuerpo y empuja.", "Agarre no demasiado estrecho: fuerza las muñecas."]),
  // ----- Bíceps
  e("curl-barra", "Curl con barra", "Barra", ["biceps", "antebrazos"], ["De pie con una barra en las manos, palmas hacia arriba y codos pegados al cuerpo.", "Sube la barra doblando solo los codos hasta el pecho y baja despacio.", "No balancees la espalda. Si lo haces, baja el peso."], { alias: ["Curl de bíceps", "Curl con barra Z"] }),
  e("curl-mancuernas", "Curl con mancuernas", "Mancuernas", ["biceps", "antebrazos"], ["De pie o sentado con una mancuerna en cada mano, palmas hacia delante.", "Sube una mancuerna girando ligeramente la muñeca hacia fuera y baja controlando; alterna.", "Codos fijos al lado del cuerpo."], { alias: ["Curl alterno"] }),
  e("curl-martillo", "Curl martillo", "Mancuernas", ["biceps", "antebrazos"], ["Mancuernas a los lados con las palmas mirándose.", "Sube sin girar la muñeca hasta casi tocar el hombro y baja con control.", "Trabaja bíceps y antebrazo. Evita el impulso."], { alias: ["Martillo"] }),
  e("curl-predicador", "Curl predicador", "Barra", ["biceps"], ["Apoya la parte alta de los brazos en el banco predicador.", "Sube doblando los codos y baja casi hasta estirar sin soltar la tensión.", "No estires del todo abajo con mucho peso: cuida el tendón."], { alias: ["Predicador", "Curl Scott"] }),
  e("curl-polea", "Curl en polea", "Polea", ["biceps"], ["Frente a la polea baja con barra o cuerda, codos pegados.", "Sube hasta contraer el bíceps y baja despacio.", "La polea mantiene tensión constante: controla la bajada."]),
  e("curl-inclinado", "Curl inclinado", "Mancuernas", ["biceps"], ["Sentado en banco inclinado a 45° con los brazos colgando.", "Sube las mancuernas sin mover los codos y baja hasta estirar el bíceps.", "Gran estiramiento: usa poco peso."]),
  e("curl-concentrado", "Curl concentrado", "Mancuernas", ["biceps"], ["Sentado, apoya el codo en la parte interior del muslo con la mancuerna colgando.", "Sube hasta contraer el bíceps y baja despacio.", "Solo se mueve el antebrazo."]),
  // ----- Espalda
  e("dominadas", "Dominadas", "Peso corporal", ["dorsales", "biceps", "trapecio"], ["Cuélgate de la barra con agarre algo más ancho que los hombros y hombros hacia abajo.", "Sube llevando el pecho hacia la barra tirando con los codos hacia abajo y baja controlando.", "Evita balancearte. Si aún no puedes, usa la máquina asistida o bandas."], { bw: true, alias: ["Pull ups", "Dominada"] }),
  e("jalon-pecho", "Jalón al pecho", "Polea", ["dorsales", "biceps"], ["Siéntate en la máquina con los muslos fijados y agarra la barra ancha.", "Tira de la barra hacia la parte alta del pecho llevando los codos hacia abajo y atrás.", "No te eches demasiado hacia atrás ni tires con los brazos: piensa en juntar los omóplatos."], { alias: ["Jalón", "Jalón dorsal"] }),
  e("remo-barra", "Remo con barra", "Barra", ["dorsales", "trapecio", "biceps"], ["Inclina el torso hacia delante con la espalda recta y la barra colgando.", "Tira de la barra hacia el abdomen llevando los codos atrás y baja con control.", "Espalda neutra siempre. No uses impulso de cadera."], { alias: ["Remo"] }),
  e("remo-mancuerna", "Remo con mancuerna", "Mancuernas", ["dorsales", "biceps"], ["Apoya una mano y una rodilla en un banco; la otra mano sujeta la mancuerna.", "Tira de la mancuerna hacia la cadera con el codo pegado al cuerpo y baja estirando.", "No gires el torso. Siente el dorsal, no el brazo."], { alias: ["Remo unilateral"] }),
  e("remo-polea", "Remo en polea baja", "Polea", ["dorsales", "trapecio"], ["Sentado con los pies en el soporte, rodillas semiflexionadas y espalda recta.", "Tira del agarre hacia el abdomen juntando los omóplatos y vuelve estirando sin encorvarte.", "No te balancees hacia atrás."], { alias: ["Remo sentado", "Remo con polea"] }),
  e("remo-maquina", "Remo en máquina", "Máquina", ["dorsales", "trapecio"], ["Ajusta el asiento y apoya el pecho en la almohadilla.", "Tira de las asas llevando los codos atrás y vuelve despacio.", "Pecho pegado, hombros lejos de las orejas."]),
  e("remo-t", "Remo en T", "Barra", ["dorsales", "trapecio"], ["Colócate sobre la barra en V con la espalda recta y las rodillas flexionadas.", "Tira del agarre hacia el pecho bajo y baja con control.", "Evita encorvar la espalda."]),
  e("pullover", "Pull-over con mancuerna", "Mancuernas", ["dorsales", "pecho"], ["Tumbado en un banco sujetando una mancuerna sobre el pecho con los brazos estirados.", "Baja la mancuerna por detrás de la cabeza en arco y vuelve a subirla.", "Codos ligeramente flexionados y costillas abajo."], { alias: ["Pullover"] }),
  e("peso-muerto", "Peso muerto convencional", "Barra", ["lumbar", "gluteos", "isquios", "trapecio"], ["Pies a la anchura de la cadera con la barra sobre el medio del pie. Agarra la barra con la espalda recta.", "Empuja el suelo con las piernas y estira la cadera hasta ponerte de pie; baja la barra pegada a las piernas.", "Espalda neutra, barra pegada al cuerpo. Empieza ligero: es el ejercicio donde más importa la técnica."], { alias: ["Peso muerto", "Deadlift"] }),
  e("encogimientos", "Encogimientos de trapecio", "Mancuernas", ["trapecio"], ["De pie con mancuernas a los lados.", "Sube los hombros hacia las orejas, aguanta un segundo y baja.", "Sin rotar los hombros. Movimiento vertical."], { alias: ["Encogimientos", "Shrugs"] }),
  e("hiperextensiones", "Hiperextensiones", "Peso corporal", ["lumbar", "gluteos"], ["Apoya la cadera en el banco romano con los pies fijos y el cuerpo recto.", "Baja el torso doblando la cadera y sube hasta quedar en línea recta.", "No subas por encima de la línea del cuerpo."], { bw: true, alias: ["Extensiones lumbares"] }),
  // ----- Piernas
  e("sentadilla", "Sentadilla con barra", "Barra", ["cuadriceps", "gluteos", "isquios"], ["Barra sobre los trapecios, pies a la anchura de los hombros con las puntas algo abiertas.", "Baja doblando cadera y rodillas como si te sentaras, hasta que los muslos queden paralelos al suelo o más, y sube empujando el suelo.", "Rodillas alineadas con los pies, pecho arriba, espalda neutra. Empieza con poco peso o con la barra sola."], { alias: ["Sentadilla", "Squat"] }),
  e("sentadilla-frontal", "Sentadilla frontal", "Barra", ["cuadriceps", "gluteos"], ["Barra apoyada en la parte delantera de los hombros con los codos altos.", "Baja con el torso muy vertical hasta paralelo y sube.", "Codos altos todo el recorrido."]),
  e("sentadilla-goblet", "Sentadilla goblet", "Mancuernas", ["cuadriceps", "gluteos"], ["Sujeta una mancuerna contra el pecho con las dos manos.", "Baja entre las rodillas con la espalda recta y sube.", "Perfecta para aprender la sentadilla."]),
  e("prensa", "Prensa de piernas", "Máquina", ["cuadriceps", "gluteos"], ["Siéntate con la espalda y la cadera pegadas al respaldo y los pies en la plataforma a la anchura de los hombros.", "Baja las rodillas hacia el pecho de forma controlada y empuja sin estirarlas del todo.", "No despegues la cadera del asiento ni bloquees las rodillas."], { alias: ["Prensa", "Leg press"] }),
  e("zancadas", "Zancadas", "Mancuernas", ["cuadriceps", "gluteos"], ["De pie, da un paso largo hacia delante.", "Baja hasta que ambas rodillas formen unos 90° y vuelve empujando con la pierna delantera.", "Torso recto y rodilla delantera sobre el pie."], { alias: ["Desplantes", "Estocadas", "Lunges"] }),
  e("sentadilla-bulgara", "Sentadilla búlgara", "Mancuernas", ["cuadriceps", "gluteos"], ["Apoya el empeine de una pierna en un banco detrás de ti.", "Baja con la pierna delantera hasta que el muslo quede paralelo y sube.", "Exigente: empieza sin peso."]),
  e("extension-cuadriceps", "Extensión de cuádriceps", "Máquina", ["cuadriceps"], ["Siéntate en la máquina con el rodillo sobre los tobillos.", "Estira las piernas hasta arriba, aprieta y baja despacio.", "Sin impulso y sin bloquear con fuerza la rodilla."], { alias: ["Extensiones de pierna", "Sillón de cuádriceps"] }),
  e("curl-femoral-tumbado", "Curl femoral tumbado", "Máquina", ["isquios"], ["Tumbado boca abajo con el rodillo detrás de los tobillos.", "Dobla las rodillas llevando los talones hacia los glúteos y baja con control.", "No levantes la cadera."], { alias: ["Curl femoral", "Curl de pierna"] }),
  e("curl-femoral-sentado", "Curl femoral sentado", "Máquina", ["isquios"], ["Siéntate con el rodillo sobre los tobillos y los muslos fijados.", "Dobla las rodillas tirando hacia abajo y vuelve despacio.", "Espalda pegada al respaldo."]),
  e("peso-muerto-rumano", "Peso muerto rumano", "Barra", ["isquios", "gluteos", "lumbar"], ["De pie con la barra o mancuernas delante de los muslos y las rodillas ligeramente flexionadas.", "Lleva la cadera hacia atrás bajando la barra pegada a las piernas hasta sentir estirar los isquios y sube.", "Espalda recta todo el tiempo. El movimiento nace de la cadera."], { alias: ["Rumano", "Peso muerto rumano con barra"] }),
  e("hip-thrust", "Hip thrust", "Barra", ["gluteos", "isquios"], ["Apoya la parte alta de la espalda en un banco con la barra sobre la cadera y los pies firmes.", "Empuja la cadera hacia arriba hasta alinear rodillas, cadera y hombros y aprieta los glúteos.", "No arquees la zona lumbar al subir; mentón ligeramente hacia el pecho."], { alias: ["Empuje de cadera"] }),
  e("puente-gluteo", "Puente de glúteo", "Peso corporal", ["gluteos", "isquios"], ["Tumbado boca arriba con las rodillas dobladas y los pies en el suelo.", "Sube la cadera apretando los glúteos y baja sin apoyar del todo.", "Buen ejercicio para empezar."], { bw: true }),
  e("abduccion-maquina", "Abducción en máquina", "Máquina", ["gluteos"], ["Siéntate con las rodillas por dentro de las almohadillas.", "Abre las piernas hacia fuera y vuelve con control.", "Espalda apoyada y movimiento sin rebotes."], { alias: ["Abductores"] }),
  e("hack-squat", "Hack squat", "Máquina", ["cuadriceps", "gluteos"], ["Espalda y hombros apoyados en la máquina con los pies en la plataforma.", "Baja doblando las rodillas y sube empujando.", "Mantén los talones apoyados."]),
  e("gemelos-pie", "Elevación de gemelos de pie", "Máquina", ["gemelos"], ["De pie con la punta de los pies en un escalón y los talones fuera.", "Sube sobre las puntas lo más alto posible, aguanta un segundo y baja estirando.", "Recorrido completo, sin rebotes."], { alias: ["Gemelos", "Elevación de talones", "Pantorrillas"] }),
  e("gemelos-sentado", "Gemelos sentado", "Máquina", ["gemelos"], ["Sentado con las rodillas bajo la almohadilla y la punta de los pies en la plataforma.", "Sube los talones y baja despacio hasta estirar.", "Lento y con pausa arriba."]),
  e("step-up", "Step-up", "Mancuernas", ["cuadriceps", "gluteos"], ["Frente a un cajón o banco con una mancuerna en cada mano.", "Sube empujando con la pierna delantera y baja controlando.", "No te impulses con la pierna de atrás."], { alias: ["Subidas al cajón"] }),
  // ----- Core
  e("plancha", "Plancha", "Peso corporal", ["abdomen", "oblicuos"], ["Apoya los antebrazos y las puntas de los pies; el cuerpo en línea recta.", "Aprieta abdomen y glúteos y mantén la posición respirando con normalidad.", "No hundas la cadera ni la subas. Empieza con 20–30 segundos."], { bw: true, alias: ["Plank"] }),
  e("crunch", "Crunch abdominal", "Peso corporal", ["abdomen"], ["Tumbado con las rodillas dobladas y las manos junto a las sienes o cruzadas en el pecho.", "Sube los hombros del suelo contrayendo el abdomen y baja con control.", "No tires del cuello. El movimiento es corto."], { bw: true, alias: ["Abdominales", "Abdominales crunch"] }),
  e("elevacion-piernas", "Elevación de piernas colgado", "Peso corporal", ["abdomen"], ["Cuélgate de una barra con el cuerpo estirado.", "Sube las piernas rectas (o dobladas si es difícil) hasta la cadera y baja sin balancearte.", "Evita el balanceo: controla la bajada."], { bw: true, alias: ["Elevaciones de piernas"] }),
  e("rueda-abdominal", "Rueda abdominal", "Otro", ["abdomen"], ["De rodillas con las manos en la rueda delante de ti.", "Rueda hacia delante estirando el cuerpo sin hundir la espalda y vuelve contrayendo el abdomen.", "Avanza solo hasta donde mantengas la espalda recta. Es avanzado."], { alias: ["Ab wheel"] }),
  e("russian-twist", "Giros rusos", "Peso corporal", ["oblicuos", "abdomen"], ["Sentado con el torso inclinado hacia atrás y los pies ligeramente elevados.", "Gira el torso de lado a lado llevando las manos (o un disco) hacia cada costado.", "Espalda recta, giro desde el torso."], { bw: true, alias: ["Russian twist"] }),
  e("plancha-lateral", "Plancha lateral", "Peso corporal", ["oblicuos"], ["Apoya un antebrazo en el suelo y el cuerpo de lado en línea recta.", "Eleva la cadera y mantén la posición.", "Haz ambos lados."], { bw: true }),
  e("crunch-polea", "Crunch en polea", "Polea", ["abdomen"], ["De rodillas frente a la polea alta con la cuerda junto a la cabeza.", "Encorva el torso llevando los codos hacia las rodillas y vuelve despacio.", "Mueve la columna, no la cadera."], { alias: ["Abdominales en polea"] }),
];

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const index = new Map<string, Exercise>();
for (const ex of EXERCISES) {
  index.set(fold(ex.name), ex);
  ex.alias?.forEach((a) => index.set(fold(a), ex));
}

/** Busca un ejercicio por nombre exacto o alias (sin importar mayúsculas ni tildes). */
export const findExercise = (name: string): Exercise | undefined => index.get(fold(name));

export const exerciseMuscle = (ex: Exercise): Muscle => ZONE_MUSCLE[ex.zones[0]!];

/** Búsqueda difusa para el selector: todas las palabras deben aparecer en nombre, alias o zona. */
export function searchExercises(query: string, muscle?: Muscle | "all"): Exercise[] {
  const words = fold(query).split(" ").filter(Boolean);
  return EXERCISES.filter((ex) => {
    if (muscle && muscle !== "all" && exerciseMuscle(ex) !== muscle) return false;
    if (!words.length) return true;
    const hay = fold([ex.name, ...(ex.alias ?? []), ...ex.zones.map((z) => ZONE_LABEL[z]), ex.equip].join(" "));
    return words.every((w) => hay.includes(w));
  });
}
