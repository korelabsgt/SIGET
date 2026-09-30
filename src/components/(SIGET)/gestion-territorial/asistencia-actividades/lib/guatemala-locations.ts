import departamentosData from "./guatemala-departamentos.json";

export type DepartamentoGt = {
  codigo: string;
  nombre: string;
  municipios: string[];
};

export const DEPARTAMENTOS_GT: DepartamentoGt[] = departamentosData;

export function getMunicipiosPorDepartamento(departamento: string): string[] {
  const dep = DEPARTAMENTOS_GT.find(
    (d) => d.nombre.toLowerCase() === departamento.toLowerCase(),
  );
  return dep?.municipios ?? [];
}

function claveLugar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/^departamento de\s+/, "")
    .replace(/^el\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function resolverDepartamentoGt(nombre: string): string | null {
  const clave = claveLugar(nombre);
  return (
    DEPARTAMENTOS_GT.find((d) => claveLugar(d.nombre) === clave)?.nombre ?? null
  );
}

export function resolverMunicipioGt(
  departamento: string,
  candidatos: string[],
): string | null {
  const munis = getMunicipiosPorDepartamento(departamento);
  for (const cand of candidatos) {
    const clave = claveLugar(cand);
    const exacto = munis.find((m) => claveLugar(m) === clave);
    if (exacto) return exacto;
  }
  return null;
}

export type NominatimAddress = {
  amenity?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  hamlet?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
  house_number?: string;
};

export function armarUbicacionDesdeNominatim(
  address: NominatimAddress,
): { direccion: string; municipio: string; departamento: string } | null {
  if (!address.state) return null;
  const departamento = resolverDepartamentoGt(address.state);
  if (!departamento) return null;
  const municipio = resolverMunicipioGt(
    departamento,
    [
      address.county,
      address.municipality,
      address.city,
      address.town,
      address.village,
      address.suburb,
    ].filter((parte): parte is string => !!parte?.trim()),
  );
  if (!municipio) return null;
  const via = [address.house_number, address.road || address.pedestrian]
    .filter(Boolean)
    .join(" ");
  const direccion = [address.amenity, via, address.neighbourhood || address.suburb]
    .filter((parte) => !!parte?.trim())
    .join(", ");
  return {
    direccion: direccion || "Ubicación capturada",
    municipio,
    departamento,
  };
}
