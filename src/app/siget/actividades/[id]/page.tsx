import { redirect } from "next/navigation";

export default async function ActividadRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/siget/asistencia-actividades/${id}`);
}
