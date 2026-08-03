"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronDown, ChevronUp, Save, Trash2, X, Loader2, Plus, ArrowUp, ArrowDown, Settings2 } from "lucide-react";
import { useConstructorFormulario } from "./lib/hooks";

import type { ConstructorInitialData } from "./lib/zod";

interface ConstructorProps {
  onBack: () => void;
  initialData?: ConstructorInitialData;
}

export default function ConstructorFormulario({ onBack, initialData }: ConstructorProps) {
  const {
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
    handleAddIndicador,
    handleRemoveIndicador,
    handleIndicadorChange,
    handleAddValor,
    handleRemoveValor,
    handleAddCatalogCampos,
    handleClearFields,
    handleValorChange,
    handleMoveValor,
    handleSubmit,
    camposData,
    handleAddSpecificCatalogCampo
  } = useConstructorFormulario(onBack, initialData);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prevLength, setPrevLength] = useState(indicadores.length);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!loading) {
      setHasLoaded(true);
      setPrevLength(indicadores.length);
    }
  }, [loading]);

  useEffect(() => {
    if (!hasLoaded) return;
    // Si se añadió uno nuevo, expandirlo automáticamente
    if (indicadores.length > prevLength) {
      setExpandedId(indicadores[indicadores.length - 1].id);
    }
    setPrevLength(indicadores.length);
  }, [indicadores.length, hasLoaded]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex-1 w-full px-6 max-w-full pb-10 pt-32 md:pt-20"
    >
      {/* Header */}
      <div className="mx-auto mb-4 max-w-3xl px-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              {initialData?.politica ? "Editar Formulario" : "Crear Formulario"}
            </h2>
          </div>
        </div>

        {/* Stepper only when not loading */}
        {!loading && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => step === 2 && setStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${step === 1
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400"
                : "bg-muted border-border text-muted-foreground dark:bg-secondary/40 dark:border-border cursor-pointer"
                }`}
            >
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black">1</span>
              Política
            </button>
            <div className="w-8 h-px bg-border" />
            <button
              onClick={() => step === 1 && codigoPolitica && sectorId && setStep(2)}
              disabled={!codigoPolitica || !sectorId}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${step === 2
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400"
                : "bg-muted border-border text-muted-foreground dark:bg-secondary/40 dark:border-border disabled:opacity-50 disabled:cursor-not-allowed" +
                (codigoPolitica && sectorId ? " cursor-pointer" : "")
                }`}
            >
              <span className="w-4 h-4 rounded-full bg-muted-foreground text-white flex items-center justify-center text-[9px] font-black">2</span>
              Indicadores
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-10 animate-pulse max-w-3xl mx-auto">
          <div className="h-6 bg-muted dark:bg-accent rounded w-1/3 mx-auto mb-8" />
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-2 bg-muted dark:bg-accent rounded w-20" />
                <div className="h-10 bg-muted/80 dark:bg-background rounded-lg w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Stepper with Framer Motion slide-in animations */}
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto bg-card rounded-3xl border border-border p-6 md:p-8 shadow-xl shadow-slate-200/10 dark:shadow-none space-y-6"
              >
                {/* Cabecera del Paso 1 */}
                <div className="flex items-center gap-3 w-full pb-3 border-b border-border">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">1</span>
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest leading-tight">Datos de la Política de Migración</h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1">Sector Responsable</label>
                    <select
                      disabled
                      value={sectorId}
                      onChange={(e) => setSectorId(e.target.value)}
                      className="w-full bg-muted dark:bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold text-muted-foreground focus:outline-none transition-all appearance-none cursor-not-allowed"
                    >
                      <option value="">-- Seleccione sector --</option>
                      {sectores.map((s) => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1">Código de Acción</label>
                    <input
                      type="text"
                      value={codigoPolitica}
                      onChange={(e) => setCodigoPolitica(e.target.value)}
                      placeholder="Ej. 1.1.1"
                      className="w-full bg-muted/80 dark:bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1">Descripción de la Política</label>
                    <textarea
                      value={descPolitica}
                      onChange={(e) => setDescPolitica(e.target.value)}
                      placeholder="Descripción detallada..."
                      className="w-full bg-muted/80 dark:bg-background border border-border rounded-xl px-4 py-3 text-xs leading-relaxed font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all min-h-[140px] resize-none overflow-hidden"
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                  </div>

                  {/* Botón Siguiente Centrado y Elegante */}
                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!codigoPolitica || !sectorId}
                      className="w-full max-w-[200px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto bg-card rounded-3xl border border-border p-0 md:p-8 shadow-xl shadow-slate-200/10 dark:shadow-none space-y-6"
              >
                {/* Cabecera del Paso 2 */}
                <div className="flex items-center gap-3 pb-3 border-b border-border w-full px-6 pt-6 md:px-0 md:pt-0">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-black shrink-0">2</span>
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest leading-tight">Estructura de Indicadores</h3>
                </div>

                {/* Listado de Indicadores colapsables */}
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {indicadores.map((ind, indIdx) => (
                      <motion.div
                        key={ind.id}
                        layout
                        className={`relative overflow-hidden md:rounded-2xl border-y md:border-x transition-all duration-300 ${expandedId === ind.id
                          ? 'bg-card border-emerald-500/50 dark:border-emerald-500/40'
                          : 'bg-muted/50 dark:bg-background border-border'
                          }`}
                      >
                        {/* Cabecera de la Card (Toggle) */}
                        <div
                          className={`p-5 cursor-pointer flex items-center justify-between transition-colors ${expandedId === ind.id ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : 'hover:bg-muted dark:hover:bg-accent/30'
                            }`}
                          onClick={() => setExpandedId(expandedId === ind.id ? null : ind.id)}
                        >
                          <div className="flex-1 space-y-1.5 min-w-0 pr-4">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Indicador {indIdx + 1}</label>
                            {expandedId !== ind.id && (
                              <div className="text-sm font-bold text-foreground transition-all truncate">
                                {ind.nombre || <span className="text-muted-foreground italic font-normal">Nombre del indicador...</span>}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {!ind.persisted && indIdx > 0 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveIndicador(ind.id);
                                }}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className={`p-1.5 rounded-lg ${expandedId === ind.id ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>
                              {expandedId === ind.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedId === ind.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-0 border-t border-border">
                                {/* Campo de edición del nombre */}
                                <div className="space-y-3 pt-5">
                                  <label className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1">Nombre del Indicador</label>
                                  <textarea
                                    value={ind.nombre}
                                    onChange={(e) => handleIndicadorChange(ind.id, e.target.value)}
                                    placeholder="Nombre del indicador..."
                                    rows={1}
                                    className="w-full bg-muted/80 dark:bg-background border border-border rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all resize-none overflow-hidden"
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement;
                                      target.style.height = "auto";
                                      target.style.height = `${target.scrollHeight}px`;
                                    }}
                                    ref={(el) => {
                                      if (el) {
                                        setTimeout(() => {
                                          el.style.height = "auto";
                                          el.style.height = `${el.scrollHeight}px`;
                                        }, 50);
                                      }
                                    }}
                                  />
                                </div>

                                {/* Campos del Indicador */}
                                <div className="space-y-3 pt-6">
                                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] pl-1">Campos del Indicador</label>
                                  <div className="grid grid-cols-1 gap-y-3.5 pt-2">
                                    <AnimatePresence mode="popLayout">
                                      {ind.valores.map((val, vIdx) => (
                                        <motion.div
                                          key={val.id}
                                          layout
                                          className="flex items-center gap-2 group/valor"
                                        >
                                          <button
                                            onClick={() => handleRemoveValor(ind.id, val.id)}
                                            className="p-1 text-red-400 hover:text-red-600 bg-red-50/50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 rounded-md transition-colors cursor-pointer shrink-0"
                                            title="Quitar campo"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                          <input
                                            type="text"
                                            value={val.nombre}
                                            onChange={(e) => handleValorChange(ind.id, val.id, e.target.value)}
                                            placeholder={`Campo ${vIdx + 1}...`}
                                            className="flex-1 min-w-0 bg-muted/80 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/10 transition-all"
                                          />
                                          <div className="flex flex-col gap-0.5 shrink-0 pl-1">
                                            <button
                                              onClick={() => handleMoveValor(ind.id, val.id, "up")}
                                              disabled={vIdx === 0}
                                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            >
                                              <ArrowUp className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleMoveValor(ind.id, val.id, "down")}
                                              disabled={vIdx === ind.valores.length - 1}
                                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                            >
                                              <ArrowDown className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                                    {camposData.filter(c => !ind.valores.map(v => v.nombre.toLowerCase().trim()).includes(c.nombre.toLowerCase().trim())).map(missing => (
                                      <button
                                        key={missing.id}
                                        onClick={() => handleAddSpecificCatalogCampo(ind.id, missing)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-accent dark:bg-accent dark:hover:bg-accent/80 text-[10px] font-bold text-foreground transition-all cursor-pointer border border-border hover:border-emerald-500/30 group"
                                      >
                                        <Plus className="w-3 h-3 text-emerald-500" />
                                        {missing.nombre}
                                      </button>
                                    ))}
                                    {camposData.filter(c => !ind.valores.map(v => v.nombre.toLowerCase().trim()).includes(c.nombre.toLowerCase().trim())).length === 0 && (
                                      <span className="text-[10px] font-medium text-muted-foreground italic px-2 py-1">Todos los campos del catálogo están agregados.</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4">
                                  <button
                                    onClick={() => handleAddValor(ind.id)}
                                    className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer px-2 py-1 rounded-md hover:bg-emerald-50"
                                  >
                                    Agregar Campo
                                  </button>

                                  {!ind.persisted && (
                                    <>
                                      <div className="w-px h-3 bg-border" />

                                      <button
                                        onClick={() => handleAddCatalogCampos(ind.id)}
                                        className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 transition-all cursor-pointer px-2 py-1 rounded-md hover:bg-emerald-50"
                                      >
                                        Agregar del Catálogo
                                      </button>

                                      <button
                                        onClick={() => handleClearFields(ind.id)}
                                        className="text-[9px] font-black text-amber-600 hover:text-amber-700 transition-all cursor-pointer px-2 py-1 rounded-md hover:bg-amber-50"
                                      >
                                        Limpiar Campos
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="flex justify-center px-6 md:px-0 pt-2">
                  <button
                    onClick={handleAddIndicador}
                    className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer rounded-xl active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo Indicador
                  </button>
                </div>

                {/* Botones de Paso 2 Centrados y Proporcionales */}
                <div className="pt-6 pb-6 px-6 md:pb-0 md:px-0 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 border border-border text-foreground rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-muted dark:hover:bg-accent transition-all cursor-pointer"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || !codigoPolitica || !sectorId}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      "Guardar"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
