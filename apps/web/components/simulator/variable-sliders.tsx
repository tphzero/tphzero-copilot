'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface SliderConfig {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'humedadSueloPct', label: 'Humedad del suelo', unit: '%', min: 0, max: 50, step: 1 },
  { key: 'temperaturaSueloC', label: 'Temperatura del suelo', unit: 'C', min: 5, max: 45, step: 1 },
  { key: 'oxigenoPct', label: 'Oxigeno', unit: '%', min: 0, max: 25, step: 0.5 },
  { key: 'fertilizanteN', label: 'Fertilizante N', unit: 'mg/kg', min: 0, max: 100, step: 5 },
  { key: 'fertilizanteP', label: 'Fertilizante P', unit: 'mg/kg', min: 0, max: 50, step: 5 },
  { key: 'fertilizanteK', label: 'Fertilizante K', unit: 'mg/kg', min: 0, max: 100, step: 5 },
  { key: 'frecuenciaVolteoDias', label: 'Frecuencia de volteo', unit: 'dias', min: 7, max: 60, step: 1 },
];

interface VariableSlidersProps {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

export function VariableSliders({ values, onChange }: VariableSlidersProps) {
  return (
    <div className="space-y-5">
      {SLIDERS.map(({ key, label, unit, min, max, step }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm text-zinc-400">{label}</Label>
            <span className="font-mono text-sm text-emerald-400">
              {(values[key] ?? (min + max) / 2).toFixed(step < 1 ? 1 : 0)} {unit}
            </span>
          </div>
          <Slider
            value={[values[key] ?? (min + max) / 2]}
            onValueChange={(nextValue) => {
              const value = Array.isArray(nextValue) ? nextValue[0] : nextValue;
              onChange(key, value);
            }}
            min={min}
            max={max}
            step={step}
            className="[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-300 [&_[data-slot=slider-thumb]]:bg-emerald-500"
          />
        </div>
      ))}
    </div>
  );
}

export { SLIDERS };
