'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { KatexInline } from '@/components/simulator/katex-inline';

interface SliderConfig {
  key: string;
  label: string;
  /** LaTeX (sin delimitadores $); se pasa a KaTeX en linea para la unidad. */
  unitLatex: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  {
    key: 'humedadSueloPct',
    label: 'Humedad del suelo',
    unitLatex: String.raw`\%`,
    min: 0,
    max: 50,
    step: 1,
  },
  {
    key: 'temperaturaSueloC',
    label: 'Temperatura del suelo',
    unitLatex: String.raw`^{\circ}\mathrm{C}`,
    min: 5,
    max: 45,
    step: 1,
  },
  {
    key: 'oxigenoPct',
    label: 'Oxigeno',
    unitLatex: String.raw`\%`,
    min: 0,
    max: 25,
    step: 0.5,
  },
  {
    key: 'fertilizanteN',
    label: 'Fertilizante N',
    unitLatex: String.raw`\mathrm{mg\,kg}^{-1}`,
    min: 0,
    max: 100,
    step: 5,
  },
  {
    key: 'fertilizanteP',
    label: 'Fertilizante P',
    unitLatex: String.raw`\mathrm{mg\,kg}^{-1}`,
    min: 0,
    max: 50,
    step: 5,
  },
  {
    key: 'fertilizanteK',
    label: 'Fertilizante K',
    unitLatex: String.raw`\mathrm{mg\,kg}^{-1}`,
    min: 0,
    max: 100,
    step: 5,
  },
  {
    key: 'frecuenciaVolteoDias',
    label: 'Frecuencia de volteo',
    unitLatex: String.raw`\mathrm{d}`,
    min: 7,
    max: 60,
    step: 1,
  },
];

interface VariableSlidersProps {
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

export function VariableSliders({ values, onChange }: VariableSlidersProps) {
  return (
    <div className="space-y-5">
      {SLIDERS.map(({ key, label, unitLatex, min, max, step }) => (
        <div key={key} className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label className="text-sm text-zinc-400">{label}</Label>
            <span className="flex items-baseline gap-1.5 font-mono text-sm text-emerald-400">
              <span>{(values[key] ?? (min + max) / 2).toFixed(step < 1 ? 1 : 0)}</span>
              <KatexInline latex={unitLatex} />
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
