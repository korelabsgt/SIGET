export function primerNombre(
  nombreCompleto: string | null | undefined,
  fallback = "Usuario",
): string {
  const trimmed = (nombreCompleto ?? "").trim();
  if (!trimmed) return fallback;
  const first = trimmed.split(/\s+/)[0];
  return first || fallback;
}

const SALUDOS_ENTRADA_NEUTROS = [
  "¡Hola, ",
  "¡Un gusto, ",
  "¡Empecemos, ",
  "¡Qué bueno verte, ",
  "¡Saludos, ",
  "¡Buen día, ",
  "¡Me alegra verte, ",
  "¡Adelante, ",
  "¡Qué gusto, ",
] as const;

function saludoBienvenida(genero: string | null): string {
  if (genero === "Femenino") return "¡Bienvenida, ";
  if (genero === "Masculino") return "¡Bienvenido, ";
  return "¡Bienvenid@, ";
}

function saludoEncantado(genero: string | null): string {
  if (genero === "Femenino") return "¡Encantada, ";
  if (genero === "Masculino") return "¡Encantado, ";
  return "¡Un gusto saludarte, ";
}

export function pickSaludoEntrada(genero: string | null): string {
  const pool = [
    ...SALUDOS_ENTRADA_NEUTROS,
    saludoBienvenida(genero),
    saludoEncantado(genero),
  ];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? "¡Hola, ";
}
