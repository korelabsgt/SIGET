export const SALUDOS_MOTIVACIONALES_GT = [
  "Cada jornada cuenta: tu trabajo impulsa el desarrollo de quienes te rodean.",
  "La constancia en el día a día construye resultados que trascienden.",
  "Organizar bien hoy es ahorrar tiempo y esfuerzo mañana.",
  "Tu dedicación fortalece el trabajo de todo el equipo.",
  "Pequeños avances diarios suman grandes logros a largo plazo.",
  "La excelencia laboral empieza con la disciplina en lo cotidiano.",
  "Cada tarea bien hecha refleja tu compromiso con la institución.",
  "Tu esfuerzo diario contribuye a un entorno de trabajo más sólido.",
  "Trabajar con orden es trabajar con visión de futuro.",
  "Hoy es una buena oportunidad para avanzar con propósito y claridad.",
  "La colaboración y el orden son pilares de un equipo fuerte.",
  "Tu profesionalismo eleva la calidad del servicio que brindas.",
  "Cada detalle bien atendido suma en el resultado final.",
  "La constancia vence la improvisación: sigue adelante con confianza.",
  "El trabajo bien planificado abre espacio para mejores resultados.",
  "Tu compromiso diario hace la diferencia en el equipo.",
  "Enfócate en lo que puedes avanzar hoy y hazlo con determinación.",
  "La motivación laboral nace del sentido de lo que hacemos por otros.",
  "Sigue construyendo con dedicación: el esfuerzo siempre deja huella.",
  "El esfuerzo constante transforma metas en logros concretos.",
] as const;

export function pickSaludoMotivacional(): string {
  const index = Math.floor(Math.random() * SALUDOS_MOTIVACIONALES_GT.length);
  return SALUDOS_MOTIVACIONALES_GT[index];
}
