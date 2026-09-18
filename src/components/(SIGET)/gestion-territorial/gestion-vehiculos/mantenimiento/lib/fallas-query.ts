export const FALLAS_MANTENIMIENTO_SELECT = `
  *,
  vehiculo:ot_vehiculos!vehiculo_id(placa, marca, modelo),
  reportador:profiles!reportado_por(nombre),
  mecanico:profiles!mecanico_id(nombre)
`;
