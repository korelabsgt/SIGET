export const SALUDOS_MOTIVACIONALES_GT = [
  "No controlas todo lo que ocurre, pero sí cómo respondes hoy con orden y claridad.",
  "La fortaleza no es no cansarse: es seguir con sentido cuando la jornada pesa.",
  "Lo que haces con cuidado hoy construye la tranquilidad de mañana.",
  "Ante lo urgente, elige la acción clara; ante lo difícil, elige la constancia.",
  "Tu carácter se nota en lo pequeño: cada tarea bien hecha es una decisión.",
  "No hace falta tenerlo todo resuelto; basta con dar el siguiente paso con disciplina.",
  "Las distracciones pasan; lo que permanece es lo que entregaste con honradez.",
  "Tratar el trabajo con seriedad es respeto hacia quienes confían en ti.",
  "Paciencia con el proceso y rigor con el detalle abren caminos sólidos.",
  "Lo que no está en tus manos no debe quitarte energía de lo que sí puedes hacer.",
  "Un día sereno empieza por una tarea bien hecha a la vez.",
  "El obstáculo no detiene el camino: te muestra dónde poner el siguiente paso.",
  "Domina tu jornada actuando bien en lo inmediato, sin perder de vista el propósito.",
  "La calma viene de hacer lo correcto aunque nadie esté mirando.",
  "Enfócate en tu deber, no en el ruido: ahí está tu libertad interior.",
  "No pidas que la jornada sea fácil; pide serenidad para hacerla bien.",
  "Lo externo cambia; tu manera de cumplir lo propio es lo que te define.",
  "Acepta lo que no puedes cambiar y actúa con firmeza en lo que sí depende de ti.",
  "El valor no está en evitar el cansancio, sino en no abandonar lo que importa.",
  "Quien domina sus impulsos domina el día, aunque el día sea exigente.",
  "Haz bien lo que toca hoy; el mañana se construye con esas decisiones.",
  "La virtud del servicio público es constancia sin alarde ni queja innecesaria.",
  "No esperes condiciones perfectas: trabaja con lo que tienes y mejora un poco más.",
  "El juicio sereno ante la presión es más útil que la prisa mal dirigida.",
  "Cada interrupción es una prueba: vuelve al foco sin reprocharte el desvío.",
  "Lo digno no siempre es lo cómodo; elige lo digno cuando haya que elegir.",
  "Tu paz no depende de que todo salga bien, sino de actuar con integridad igual.",
  "El tiempo pasa; usa el presente en lo que está bajo tu responsabilidad.",
  "Menos quejas, más acción útil: ese es un camino estoico y efectivo.",
  "Sé amable con el error ajeno y exigente contigo en lo que prometiste cumplir.",
] as const;

export function pickSaludoMotivacional(): string {
  const index = Math.floor(Math.random() * SALUDOS_MOTIVACIONALES_GT.length);
  return SALUDOS_MOTIVACIONALES_GT[index];
}
