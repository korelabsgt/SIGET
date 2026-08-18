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
