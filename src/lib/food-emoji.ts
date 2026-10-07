const RULES: readonly (readonly [RegExp, string])[] = [
  [/pollo|pechuga|pavo|gallina/, "🍗"], [/carne|res\b|ternera|bistec|hamburgues|lomo|cerdo|chuleta|jamon|tocino|bacon/, "🥩"],
  [/pescado|salmon|atun|merluza|bacalao|sardina|tilapia|trucha|camaron|gamba|marisco/, "🐟"], [/huevo|tortilla/, "🥚"],
  [/arroz/, "🍚"], [/pasta|espagueti|macarron|fideo|tallarin/, "🍝"], [/pan\b|tostada|baguette|arepa|tortilla de trigo|bollo/, "🍞"],
  [/avena|cereal|granola|muesli/, "🥣"], [/papa|patata/, "🥔"], [/maiz|choclo|palomita/, "🌽"],
  [/leche|lacteo|yogur|yogurt|kefir/, "🥛"], [/queso/, "🧀"], [/mantequilla|margarina/, "🧈"],
  [/platano|banano|banana/, "🍌"], [/manzana/, "🍎"], [/naranja|mandarina|clementina/, "🍊"], [/fresa|frutilla/, "🍓"], [/uva/, "🍇"],
  [/sandia/, "🍉"], [/pina/, "🍍"], [/mango/, "🥭"], [/pera\b/, "🍐"], [/limon|lima\b/, "🍋"], [/cereza/, "🍒"], [/melocoton|durazno/, "🍑"],
  [/aguacate|palta/, "🥑"], [/tomate/, "🍅"], [/zanahoria/, "🥕"], [/brocoli|coliflor/, "🥦"], [/lechuga|ensalada|espinaca|rucula|verdura|col\b/, "🥬"],
  [/pepino/, "🥒"], [/cebolla|ajo/, "🧅"], [/pimiento|pimenton|aji\b/, "🫑"], [/champi|seta|hongo/, "🍄"],
  [/frijol|lenteja|garbanzo|alubia|judia|legumbre|haba/, "🫘"], [/nuez|nueces|almendra|cacahuete|mani\b|pistacho|avellana|anacardo/, "🥜"],
  [/chocolate|cacao|brownie/, "🍫"], [/galleta|cookie/, "🍪"], [/helado/, "🍨"], [/pastel|torta|bizcocho|tarta|donut|dona\b/, "🍰"],
  [/miel|mermelada|jalea/, "🍯"], [/cafe|espresso|capuchino/, "☕"], [/te\b|infusion/, "🍵"], [/jugo|zumo|batido|smoothie/, "🥤"],
  [/refresco|gaseosa|cola\b|soda/, "🥤"], [/cerveza/, "🍺"], [/vino/, "🍷"], [/agua\b/, "💧"], [/pizza/, "🍕"], [/hamburguesa/, "🍔"],
  [/sandwich|bocadillo|emparedado/, "🥪"], [/taco|burrito|empanada|arepa/, "🌮"], [/sopa|caldo|crema de/, "🍲"], [/sushi/, "🍣"],
  [/papas fritas|patatas fritas|snack|chips|galletas saladas/, "🍟"], [/proteina|whey|suplemento|barra/, "💪"], [/aceite|oliva/, "🫒"],
];

const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Un emoji que represente el alimento (por palabras clave). Si no hay coincidencia, un plato. */
export function foodEmoji(name: string): string {
  const n = fold(name);
  return RULES.find(([re]) => re.test(n))?.[1] ?? "🍽️";
}
