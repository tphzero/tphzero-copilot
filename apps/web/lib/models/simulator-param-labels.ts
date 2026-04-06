/** Etiquetas de UI y unidades para claves de SimulationParams (simulador). */
export const SIMULATOR_PARAM_LABELS: Record<
  string,
  { etiqueta: string; unidad: string }
> = {
  humedadSueloPct: { etiqueta: 'Humedad del suelo', unidad: '%' },
  temperaturaSueloC: { etiqueta: 'Temperatura del suelo', unidad: '°C' },
  oxigenoPct: { etiqueta: 'Oxígeno', unidad: '%' },
  fertilizanteN: { etiqueta: 'Fertilizante N', unidad: 'mg/kg' },
  fertilizanteP: { etiqueta: 'Fertilizante P', unidad: 'mg/kg' },
  fertilizanteK: { etiqueta: 'Fertilizante K', unidad: 'mg/kg' },
  frecuenciaVolteoDias: { etiqueta: 'Frecuencia de volteo', unidad: 'días' },
};

export function labelSimulatorParam(key: string): { etiqueta: string; unidad: string } {
  return (
    SIMULATOR_PARAM_LABELS[key] ?? {
      etiqueta: key,
      unidad: '',
    }
  );
}
