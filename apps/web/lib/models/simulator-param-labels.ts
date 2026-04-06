/** Etiquetas de UI y unidades (LaTeX en linea $...$) para claves de SimulationParams (simulador). */
export const SIMULATOR_PARAM_LABELS: Record<
  string,
  { etiqueta: string; unidad: string }
> = {
  humedadSueloPct: { etiqueta: 'Humedad del suelo', unidad: '$\\%$' },
  temperaturaSueloC: { etiqueta: 'Temperatura del suelo', unidad: '$^{\\circ}\\mathrm{C}$' },
  oxigenoPct: { etiqueta: 'Oxígeno', unidad: '$\\%$' },
  fertilizanteN: { etiqueta: 'Fertilizante N', unidad: '$\\mathrm{mg\\,kg}^{-1}$' },
  fertilizanteP: { etiqueta: 'Fertilizante P', unidad: '$\\mathrm{mg\\,kg}^{-1}$' },
  fertilizanteK: { etiqueta: 'Fertilizante K', unidad: '$\\mathrm{mg\\,kg}^{-1}$' },
  frecuenciaVolteoDias: { etiqueta: 'Frecuencia de volteo', unidad: '$\\mathrm{d}$' },
};

export function labelSimulatorParam(key: string): { etiqueta: string; unidad: string } {
  return (
    SIMULATOR_PARAM_LABELS[key] ?? {
      etiqueta: key,
      unidad: '',
    }
  );
}
