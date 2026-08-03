import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getSectores,
  getAllPoliticas,
  getOrganizacionesBySector, 
  getSectorIdsByOrganizacion,
  getPoliticasBySector, 
  getIndicadoresByPolitica,
  createPolitica,
  createPoliticaConIndicadores,
  createRegistro,
  createSector,
  getAllCampos,
  getPredefinedFields,
  getNacionalidades,
  getPerfiles,
  getRegistrosHistoricos,
  deleteRegistro,
} from "./actions";
import {
  type ConstructorInitialData,
  type FormIndicador,
  type FormValor,
  type ObsCampo,
  type ObsIndicador,
  type ObsIndicadorCampo,
  type ObsOrganizacion,
  type ObsPolitica,
  type ObsSector,
  type RegistroEntrada,
} from "./zod";
import Swal from "sweetalert2";

import { toast } from 'react-toastify';

// --- TanStack Query Hooks ---

export function useSectores() {
  return useQuery({
    queryKey: ["sectores"],
    queryFn: getSectores
  });
}

export function usePoliticas() {
  return useQuery({
    queryKey: ["politicas"],
    queryFn: getAllPoliticas
  });
}

export function useOrganizacionSectores(organizacionId?: string, enabled = true) {
  return useQuery({
    queryKey: ["org-sectores", organizacionId],
    queryFn: () => getSectorIdsByOrganizacion(organizacionId!),
    enabled: enabled && !!organizacionId,
  });
}

export function useCampos() {
  return useQuery({
    queryKey: ["campos"],
    queryFn: getAllCampos
  });
}

export function usePredefinedFields() {
  return useQuery({
    queryKey: ["predefinedFields"],
    queryFn: getPredefinedFields,
  });
}

export function useRegistrosHistoricos(organizacionId?: string, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["registros-historicos", organizacionId ?? "all"],
    queryFn: () => getRegistrosHistoricos(organizacionId),
    enabled,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRegistro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros-historicos"] });
      toast.success("Registro eliminado correctamente.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo eliminar el registro.");
    },
  });

  return { ...query, deleteRegistro: deleteMutation };
}

export function useNacionalidades() {
  return useQuery({
    queryKey: ["nacionalidades"],
    queryFn: getNacionalidades
  });
}

export function usePerfiles() {
  return useQuery({
    queryKey: ["perfiles"],
    queryFn: getPerfiles
  });
}

// --- Form Constructor Hook ---

function mapIndicadoresFromDb(existingInds: ObsIndicador[]): FormIndicador[] {
  return existingInds.map((ind) => ({
    id: ind.id,
    nombre: ind.nombre,
    valores: (ind.obs_indicador_campos || [])
      .filter((ic: ObsIndicadorCampo) => ic.activo)
      .sort(
        (a: ObsIndicadorCampo, b: ObsIndicadorCampo) =>
          parseInt(a.orden || "0", 10) - parseInt(b.orden || "0", 10),
      )
      .map(
        (ic): FormValor => ({
          id: ic.obs_campos?.id || ic.campo_id,
          nombre: ic.obs_campos?.nombre || "",
          persisted: true,
          indicadorCampoId: ic.id,
        }),
      ),
    persisted: true,
  }));
}

export function useConstructorFormulario(
  onSuccess: () => void,
  initialData?: ConstructorInitialData,
) {
  const [sectores, setSectores] = useState<ObsSector[]>([]);
  const [politicasExistentes, setPoliticasExistentes] = useState<ObsPolitica[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [codigoPolitica, setCodigoPolitica] = useState(initialData?.politica?.codigo || "");
  const [descPolitica, setDescPolitica] = useState(initialData?.politica?.descripcion || "");
  const [sectorId, setSectorId] = useState(initialData?.sectorId || "");
  const [selectedPoliticaId, setSelectedPoliticaId] = useState<string | null>(initialData?.politica?.id || null);
  const [indicadores, setIndicadores] = useState<FormIndicador[]>([]);


  // Modal and Search states
  const [isSelectingPolitica, setIsSelectingPolitica] = useState(false);
  const [searchPolitica, setSearchPolitica] = useState("");

  const { data: sectoresData = [], isLoading: loadingSectores } = useSectores();
  const { data: camposData = [], isLoading: loadingCampos } = useCampos();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sectoresData.length > 0) {
      setSectores(sectoresData);
    }
  }, [sectoresData]);

  useEffect(() => {
    async function fetchData() {
      if (loadingSectores) return;
      
      try {
        // Si estamos editando, cargar indicadores existentes
        if (initialData?.politica?.id) {
          const existingInds = await getIndicadoresByPolitica(initialData.politica.id);
          if (existingInds && existingInds.length > 0) {
            setIndicadores(mapIndicadoresFromDb(existingInds));
          } else {
            setIndicadores([{ id: crypto.randomUUID(), nombre: "", valores: [{ id: crypto.randomUUID(), nombre: "", persisted: false }], persisted: false }]);
          }
        } else {
          setIndicadores([{ 
            id: crypto.randomUUID(), 
            nombre: "", 
            valores: [{ id: crypto.randomUUID(), nombre: "", persisted: false }],
            persisted: false
          }]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [loadingSectores, initialData?.politica?.id]);

  const handleAddIndicador = () => {
    setIndicadores([...indicadores, { 
      id: crypto.randomUUID(), 
      nombre: "", 
      valores: [{ id: crypto.randomUUID(), nombre: "", persisted: false }],
      persisted: false 
    }]);
  };

  const handleRemoveIndicador = (id: string) => {
    const ind = indicadores.find(i => i.id === id);
    if (ind?.persisted) {
      toast.warn("Acción no permitida: No se puede eliminar un indicador que ya ha sido guardado.");
      return;
    }
    if (indicadores.length > 1) {
      setIndicadores(indicadores.filter((ind) => ind.id !== id));
    }
  };

  const handleIndicadorChange = (id: string, value: string) => {
    setIndicadores(indicadores.map((ind) => ind.id === id ? { ...ind, nombre: value } : ind));
  };

  const handleAddValor = (indicadorId: string) => {
    setIndicadores(indicadores.map((ind) => 
      ind.id === indicadorId ? { ...ind, valores: [...ind.valores, { id: crypto.randomUUID(), nombre: "", persisted: false }] } : ind
    ));
  };

  const handleRemoveValor = async (indicadorId: string, valorId: string) => {
    const result = await Swal.fire({
      title: "¿Quitar campo?",
      text: "Si quitas este campo, dejará de estar asociado a este indicador al guardar los cambios.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, quitar",
      cancelButtonText: "Cancelar",
      background: "transparent",
      customClass: {
        popup: "!bg-white dark:!bg-[#0b0b0d] !border !border-slate-200 dark:!border-slate-800 !rounded-3xl !shadow-2xl !p-6",
        title: "!text-slate-900 dark:!text-white !text-xl !font-black !mt-2",
        htmlContainer: "!text-slate-700 dark:!text-slate-200 !text-sm !font-bold !mt-4",
        confirmButton: "!bg-red-500 hover:!bg-red-600 !text-white !font-bold !py-3 !px-6 !rounded-xl !transition-all",
        cancelButton: "!bg-slate-100 dark:!bg-slate-800 hover:!bg-slate-200 dark:hover:!bg-slate-700 !text-slate-700 dark:!text-slate-300 !font-bold !py-3 !px-6 !rounded-xl !transition-all",
        actions: "!mt-8 !w-full !flex !justify-center !gap-4",
        icon: "!border-amber-500 !text-amber-500"
      },
      buttonsStyling: false
    });

    if (result.isConfirmed) {
      setIndicadores(indicadores.map((ind) => {
        if (ind.id === indicadorId) {
          if (ind.valores.length > 1) {
            return { ...ind, valores: ind.valores.filter(v => v.id !== valorId) };
          } else {
            toast.error("Error: El indicador debe tener al menos un campo.");
          }
        }
        return ind;
      }));
    }
  };

  const handleMoveValor = (indicadorId: string, valorId: string, direction: "up" | "down") => {
    setIndicadores(indicadores.map(ind => {
      if (ind.id === indicadorId) {
        const index = ind.valores.findIndex(v => v.id === valorId);
        if (index < 0) return ind;
        if (direction === "up" && index > 0) {
          const newValores = [...ind.valores];
          [newValores[index - 1], newValores[index]] = [newValores[index], newValores[index - 1]];
          return { ...ind, valores: newValores };
        } else if (direction === "down" && index < ind.valores.length - 1) {
          const newValores = [...ind.valores];
          [newValores[index], newValores[index + 1]] = [newValores[index + 1], newValores[index]];
          return { ...ind, valores: newValores };
        }
      }
      return ind;
    }));
  };

  const handleAddCatalogCampos = (indicadorId: string) => {
    setIndicadores(indicadores.map((ind) => 
      ind.id === indicadorId 
        ? { 
            ...ind, 
            valores: camposData.map(c => ({ 
              id: crypto.randomUUID(), 
              nombre: c.nombre, 
              persisted: false,
              campoId: c.id
            }))
          } 
        : ind
    ));
  };

  const handleAddSpecificCatalogCampo = (indicadorId: string, campo: ObsCampo) => {
    setIndicadores(indicadores.map((ind) => 
      ind.id === indicadorId 
        ? { 
            ...ind, 
            valores: [...ind.valores, { 
              id: crypto.randomUUID(), 
              nombre: campo.nombre, 
              persisted: false,
              campoId: campo.id
            }]
          } 
        : ind
    ));
  };

  const handleClearFields = (indicadorId: string) => {
    const ind = indicadores.find(i => i.id === indicadorId);
    if (ind?.persisted) {
       const persistedFields = ind.valores.filter(v => v.persisted);
       setIndicadores(indicadores.map(i => 
         i.id === indicadorId 
           ? { ...i, valores: persistedFields.length > 0 ? persistedFields : [{ id: crypto.randomUUID(), nombre: "", persisted: false }] }
           : i
       ));
       return;
    }

    setIndicadores(indicadores.map((ind) => 
      ind.id === indicadorId 
        ? { ...ind, valores: [{ id: crypto.randomUUID(), nombre: "", persisted: false }] } 
        : ind
    ));
  };

  const handleValorChange = (indicadorId: string, valorId: string, value: string) => {
    setIndicadores(indicadores.map((ind) => 
      ind.id === indicadorId 
        ? { ...ind, valores: ind.valores.map(v => v.id === valorId ? { ...v, nombre: value } : v) } 
        : ind
    ));
  };

  const handleCreateSector = async (nombre: string) => {
    try {
      const newSector = await createSector(nombre);
      setSectores([...sectores, newSector]);
      setSectorId(newSector.id);
      return newSector;
    } catch (err) {
      console.error("Error creating sector:", err);
      throw err;
    }
  };

  const handleSelectPolitica = (pol: ObsPolitica) => {
    setSelectedPoliticaId(pol.id);
    setCodigoPolitica(pol.codigo);
    setDescPolitica(pol.descripcion);
    setIsSelectingPolitica(false);
    // Si la política ya tiene un sector, lo seteamos
    if (pol.sector_id) {
      setSectorId(pol.sector_id);
    }
  };

  const handleCreatePoliticaAction = async () => {
    if (!codigoPolitica || !descPolitica || !sectorId) return;
    try {
      const newPol = await createPolitica(sectorId, codigoPolitica, descPolitica);
      setPoliticasExistentes([...politicasExistentes, newPol]);
      setSelectedPoliticaId(newPol.id);
      setIsSelectingPolitica(false);
      return newPol;
    } catch (err: unknown) {
      console.error("Error creating politica:", err);
      toast.error(`Error: ${err instanceof Error ? err.message : "No se pudo crear la política"}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasEmptyFields = indicadores.some(i => !i.nombre.trim() || i.valores.some(v => !v.nombre.trim()));
    if (!codigoPolitica || !descPolitica || !sectorId || hasEmptyFields) {
      toast.warn("Por favor complete todos los campos, asigne un código, descripción de la política y nombre a todos los grupos de indicadores y sus campos.");
      return;
    }

    setSaving(true);
    
    try {
      await createPoliticaConIndicadores(
        sectorId, 
        codigoPolitica, 
        descPolitica, 
        indicadores,
        selectedPoliticaId
      );
      // Invalidar consultas para refrescar listas
      queryClient.invalidateQueries({ queryKey: ["politicas"] });

      toast.success("¡Guardado con éxito! La configuración de la política ha sido guardada correctamente.");
      
      // Si estamos editando, recargamos los datos para no cerrar el formulario
      if (selectedPoliticaId) {
        const existingInds = await getIndicadoresByPolitica(selectedPoliticaId);
        if (existingInds && existingInds.length > 0) {
          setIndicadores(mapIndicadoresFromDb(existingInds));
        }
      } else {
        // Si es nuevo, cerramos el formulario para volver a la lista
        onSuccess();
      }
    } catch (err: unknown) {
      console.error("Error al guardar plantilla:", err);
      toast.error(err instanceof Error ? err.message : "Ocurrió un error al guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const filteredPoliticas = politicasExistentes.filter(p => {
    const matchesSearch = p.codigo.toLowerCase().includes(searchPolitica.toLowerCase()) ||
                         p.descripcion.toLowerCase().includes(searchPolitica.toLowerCase());
    const matchesSector = sectorId ? p.sector_id === sectorId : true;
    return matchesSearch && matchesSector;
  });

  return {
    sectores,
    loading,
    saving,
    codigoPolitica,
    setCodigoPolitica,
    descPolitica,
    setDescPolitica,
    sectorId,
    setSectorId,
    indicadores,
    isSelectingPolitica,
    setIsSelectingPolitica,
    searchPolitica,
    setSearchPolitica,
    filteredPoliticas,
    handleSelectPolitica,
    handleAddIndicador,
    handleRemoveIndicador,
    handleIndicadorChange,
    handleAddValor,
    handleRemoveValor,
    handleAddCatalogCampos,
    handleClearFields,
    handleValorChange,
    handleMoveValor,
    handleCreateSector,
    handleCreatePoliticaAction,
    handleSubmit,
    camposData,
    handleAddSpecificCatalogCampo
  };
}

export const SIN_ESPECIFICAR = "__none__";

type IndicadorNacPerfilCheck = {
  nombre?: string | null;
  obs_indicador_campos?: { obs_campos?: { nombre?: string | null } | null }[] | null;
};

const PALABRAS_OMITEN_NAC_PERFIL = /reuniones|empresas|actores/i;

export function indicadorOmiteNacPerfil(
  indicador: IndicadorNacPerfilCheck | null | undefined,
): boolean {
  if (!indicador) return false;

  const omitePorTexto = (texto?: string | null) =>
    PALABRAS_OMITEN_NAC_PERFIL.test(texto || "");

  if (omitePorTexto(indicador.nombre)) return true;

  return (indicador.obs_indicador_campos || []).some((ic) =>
    omitePorTexto(ic.obs_campos?.nombre),
  );
}

export function useFormulario(
  onSuccess: () => void,
  initialPolitica?: ObsPolitica | null,
  options?: {
    canChooseOrg?: boolean;
    userOrganizacionId?: string;
  },
) {
  const canChooseOrg = options?.canChooseOrg ?? false;
  const userOrganizacionId = options?.userOrganizacionId;
  const isOrgLocked = !canChooseOrg && !!userOrganizacionId;

  const resolveOrgs = (orgs: ObsOrganizacion[]) => {
    if (canChooseOrg) return orgs;
    if (userOrganizacionId) {
      const match = orgs.find((org) => org.id === userOrganizacionId);
      return match ? [match] : [];
    }
    return orgs;
  };

  const resolveInitialOrg = (orgs: ObsOrganizacion[]) => {
    if (canChooseOrg || !userOrganizacionId) return null;
    return orgs.find((org) => org.id === userOrganizacionId) ?? null;
  };
  const [sectores, setSectores] = useState<ObsSector[]>([]);
  const [organizaciones, setOrganizaciones] = useState<ObsOrganizacion[]>([]);
  const [politicas, setPoliticas] = useState<ObsPolitica[]>([]);
  const [indicadores, setIndicadores] = useState<ObsIndicador[]>([]);
  const [nacionalidades, setNacionalidades] = useState<import("./zod").ObsNacionalidad[]>([]);
  const [perfiles, setPerfiles] = useState<import("./zod").ObsPerfil[]>([]);
  
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [loadingOrgsPols, setLoadingOrgsPols] = useState(!!initialPolitica);
  const [loadingInds, setLoadingInds] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // If initialPolitica provided, start at step 2 (org selection) after loading
  const [step, setStep] = useState(initialPolitica ? 2 : 1);
  const [formData, setFormData] = useState({
    mesAnio: "",
    sector: null as ObsSector | null,
    organizacion: null as ObsOrganizacion | null,
    politica: initialPolitica || null as ObsPolitica | null,
  });
  
  // Multi-entry registros system
  const [registros, setRegistros] = useState<RegistroEntrada[]>([]);
  const [editingRegistroId, setEditingRegistroId] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<{
    indicadorId: string;
    nacionalidadId: string;
    perfilId: string;
    valores: Record<string, string>;
  }>({
    indicadorId: "",
    nacionalidadId: SIN_ESPECIFICAR,
    perfilId: SIN_ESPECIFICAR,
    valores: {}
  });

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [sectoresData, nacionalidadesData, perfilesData] = await Promise.all([
          getSectores(),
          getNacionalidades(),
          getPerfiles()
        ]);
        setSectores(sectoresData);
        setNacionalidades(nacionalidadesData);
        setPerfiles(perfilesData);

        // If there's an initialPolitica, find and set its sector, then load orgs
        if (initialPolitica) {
          const sector = sectoresData.find(s => s.id === initialPolitica.sector_id) || null;
          setFormData(prev => ({ ...prev, sector }));
          if (sector) {
            setLoadingOrgsPols(true);
            try {
              const [orgs, pols] = await Promise.all([
                getOrganizacionesBySector(sector.id),
                getPoliticasBySector(sector.id)
              ]);
              const visibleOrgs = resolveOrgs(orgs);
              const initialOrg = resolveInitialOrg(orgs);
              setOrganizaciones(visibleOrgs);
              setPoliticas(pols);
              if (initialOrg) {
                setFormData((prev) => ({ ...prev, organizacion: initialOrg }));
              }
            } catch(err) {
              console.error(err);
            } finally {
              setLoadingOrgsPols(false);
            }
          }
          // Pre-load indicators for the selected policy
          setLoadingInds(true);
          try {
            const inds = await getIndicadoresByPolitica(initialPolitica.id);
            setIndicadores(inds);
          } catch(err) {
            console.error(err);
          } finally {
            setLoadingInds(false);
          }
        }
      } catch (err) {
        console.error("Error fetching initial data", err);
      } finally {
        setLoadingSectores(false);
      }
    }
    fetchInitialData();
  }, []);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const resetCurrentEntry = (keepIndicador = false) => {
    setCurrentEntry({
      indicadorId: keepIndicador ? currentEntry.indicadorId : "",
      nacionalidadId: SIN_ESPECIFICAR,
      perfilId: SIN_ESPECIFICAR,
      valores: {}
    });
    setEditingRegistroId(null);
  };

  const handleSectorChange = async (sector: ObsSector) => {
    setFormData({ ...formData, sector, organizacion: null, politica: null });
    setRegistros([]);
    setEditingRegistroId(null);
    setCurrentEntry({ indicadorId: "", nacionalidadId: SIN_ESPECIFICAR, perfilId: SIN_ESPECIFICAR, valores: {} });
    setLoadingOrgsPols(true);
    
    try {
      const [orgs, pols] = await Promise.all([
        getOrganizacionesBySector(sector.id),
        getPoliticasBySector(sector.id)
      ]);
      const visibleOrgs = resolveOrgs(orgs);
      const initialOrg = resolveInitialOrg(orgs);
      setOrganizaciones(visibleOrgs);
      setPoliticas(pols);
      setFormData((prev) => ({
        ...prev,
        sector,
        organizacion: canChooseOrg ? null : initialOrg,
        politica: null,
      }));
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingOrgsPols(false);
    }
  };

  const handlePoliticaChange = async (politica: ObsPolitica) => {
    setFormData({ ...formData, politica });
    setRegistros([]);
    setEditingRegistroId(null);
    setCurrentEntry({ indicadorId: "", nacionalidadId: SIN_ESPECIFICAR, perfilId: SIN_ESPECIFICAR, valores: {} });
    setLoadingInds(true);
    
    try {
      const data = await getIndicadoresByPolitica(politica.id);
      setIndicadores(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoadingInds(false);
    }
  };

  const selectRegistroForEdit = (reg: RegistroEntrada) => {
    if (editingRegistroId === reg.id) {
      resetCurrentEntry();
      return;
    }
    setEditingRegistroId(reg.id);
    setCurrentEntry({
      indicadorId: reg.indicadorId,
      nacionalidadId: reg.nacionalidadId,
      perfilId: reg.perfilId,
      valores: { ...reg.valores }
    });
  };

  const autofillCurrentEntry = () => {
    if (!currentEntry.indicadorId) {
      toast("Seleccione un indicador antes de usar el relleno automático.", { type: "warning" });
      return;
    }

    const indicador = indicadores.find((i) => i.id === currentEntry.indicadorId);
    if (!indicador) {
      toast("Indicador no encontrado.", { type: "warning" });
      return;
    }

    const campos = (indicador.obs_indicador_campos || [])
      .filter((ic) => ic.activo !== false)
      .sort((a, b) => parseInt(a.orden || "0") - parseInt(b.orden || "0"));

    if (campos.length === 0) {
      toast("Este indicador no tiene campos para rellenar.", { type: "warning" });
      return;
    }

    const valores: Record<string, string> = { ...currentEntry.valores };
    campos.forEach((ic) => {
      valores[ic.id] = String(Math.floor(Math.random() * 11) * 10);
    });

    setCurrentEntry((prev) => ({
      ...prev,
      valores,
    }));
    toast.success("Valores numéricos rellenados automáticamente.");
  };

  const addRegistro = () => {
    if (!currentEntry.indicadorId) {
      toast("Seleccione un indicador antes de agregar.", { type: "warning" });
      return false;
    }

    const normalizedValores = Object.fromEntries(
      Object.entries(currentEntry.valores).map(([key, val]) => [key, val === "" ? "0" : val])
    );

    const indicadorActual = indicadores.find((i) => i.id === currentEntry.indicadorId);
    const omitNacPerfil = indicadorOmiteNacPerfil(indicadorActual);
    const nacionalidadId = omitNacPerfil ? SIN_ESPECIFICAR : currentEntry.nacionalidadId;
    const perfilId = omitNacPerfil ? SIN_ESPECIFICAR : currentEntry.perfilId;

    if (editingRegistroId) {
      setRegistros(prev =>
        prev.map(r =>
          r.id === editingRegistroId
            ? {
                ...r,
                indicadorId: currentEntry.indicadorId,
                nacionalidadId,
                perfilId,
                valores: normalizedValores
              }
            : r
        )
      );
      resetCurrentEntry(true);
      toast.success("Registro actualizado correctamente.");
      return true;
    }

    const newEntry: RegistroEntrada = {
      id: crypto.randomUUID(),
      indicadorId: currentEntry.indicadorId,
      nacionalidadId,
      perfilId,
      valores: normalizedValores
    };

    setRegistros(prev => [...prev, newEntry]);
    setCurrentEntry({
      indicadorId: currentEntry.indicadorId,
      nacionalidadId: SIN_ESPECIFICAR,
      perfilId: SIN_ESPECIFICAR,
      valores: {}
    });
    toast.success("Registro agregado correctamente.");
    return true;
  };

  const removeRegistro = (id: string) => {
    setRegistros(prev => prev.filter(r => r.id !== id));
    if (editingRegistroId === id) {
      resetCurrentEntry();
    }
    toast.info("Registro eliminado.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.politica || !formData.organizacion || !formData.sector || !formData.mesAnio) return;
    if (registros.length === 0) {
      toast("No hay registros para guardar.", { type: "warning" });
      return;
    }
    
    // Parse mesAnio "YYYY-MM" into mes and anio integers
    const [anioStr, mesStr] = formData.mesAnio.split("-");
    const mes = parseInt(mesStr, 10);
    const anio = parseInt(anioStr, 10);

    setIsSaving(true);
    try {
      await createRegistro(formData.organizacion.id, mes, anio, registros);
      setIsSaved(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (err) {
      console.error("Error saving form:", err);
      toast.error("Ocurrió un error al guardar los datos.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    sectores,
    organizaciones,
    politicas,
    indicadores,
    nacionalidades,
    perfiles,
    loadingSectores,
    loadingOrgsPols,
    loadingInds,
    isSaving,
    isSaved,
    step,
    setStep,
    formData,
    setFormData,
    registros,
    editingRegistroId,
    currentEntry,
    setCurrentEntry,
    addRegistro,
    autofillCurrentEntry,
    selectRegistroForEdit,
    removeRegistro,
    handleNext,
    handlePrev,
    handleSectorChange,
    handlePoliticaChange,
    handleSubmit,
    canChooseOrg,
    isOrgLocked,
  };
}
