'use client';

import type { SimulationKineticsInfo } from '@tphzero/domain';
import { ChevronDown } from 'lucide-react';

interface SimulatorKineticsPanelProps {
  kinetics: SimulationKineticsInfo;
}

/**
 * Transparencia del motor what-if: k historial, M y desglose multiplicativo.
 * Referencias generales: ley Q10 / temperatura; cinética tipo Monod (limitacion);
 * humedad como factor de actividad; volteo como proxy de aeracion.
 */
export function SimulatorKineticsPanel({ kinetics }: SimulatorKineticsPanelProps) {
  const { kPerDay, tphInitialMgkg, effectiveRateMultiplier, referenceTiempoDias, factors } =
    kinetics;

  return (
    <details className="group rounded-lg border border-zinc-800 bg-zinc-950/50 open:bg-zinc-900/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-200 marker:content-none hover:bg-zinc-800/50 [&::-webkit-details-marker]:hidden">
        <span>Como se calcula el escenario simulado</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-zinc-800 px-4 pb-4 pt-2 text-sm text-zinc-400">
        <p className="leading-relaxed">
          La <span className="text-zinc-300">linea base</span> sigue una degradacion exponencial
          ajustada solo al historial: se estima{' '}
          <span className="font-mono text-emerald-400/90">k</span> (1/d) por regresion lineal sobre{' '}
          <span className="font-mono">ln(TPH/TPH0)</span> frente al tiempo. El{' '}
          <span className="text-zinc-300">escenario simulado</span> usa el mismo{' '}
          <span className="font-mono text-emerald-400/90">TPH0</span> y el mismo{' '}
          <span className="font-mono text-emerald-400/90">k</span>, pero la tasa efectiva es{' '}
          <span className="font-mono text-blue-400/90">k · M</span>, donde{' '}
          <span className="font-mono text-blue-400/90">M</span> resume el efecto de los sliders
          respecto a la ultima medicion (dia {referenceTiempoDias}).
        </p>
        <p className="leading-relaxed text-zinc-500">
          Cada factor es un cociente <span className="font-mono">f(sim)/f(ref)</span> (aprox. 1 si
          no cambias ese control). El producto se acota para evitar valores extremos. Esto sigue
          ideas estandar en biorremediacion: temperatura con regla Q10; oxigeno y nutrientes con
          saturacion tipo Monod; humedad con un factor maximo en torno a un rango operativo; volteo
          como proxy de mezcla y aeracion.
        </p>
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">TPH inicial (serie)</dt>
            <dd className="mt-1 font-mono text-zinc-200">
              {tphInitialMgkg.toLocaleString('es-ES', { maximumFractionDigits: 1 })} mg/kg
            </dd>
          </div>
          <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">k (historial)</dt>
            <dd className="mt-1 font-mono text-zinc-200">
              {kPerDay < 1e-8 ? '—' : kPerDay.toExponential(4)} /d
            </dd>
          </div>
          <div className="rounded border border-zinc-800/80 bg-zinc-900/40 p-3 sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">
              M (multiplicador operativo)
            </dt>
            <dd className="mt-1 font-mono text-lg text-blue-400">
              {effectiveRateMultiplier.toFixed(3)}
            </dd>
          </div>
        </dl>
        {factors.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Factores respecto a la referencia
            </p>
            <ul className="max-h-48 space-y-1.5 overflow-y-auto text-xs">
              {factors.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-800/60 py-1.5 last:border-0"
                >
                  <span className="text-zinc-400">{f.label}</span>
                  <span className="font-mono text-zinc-200">{f.ratio.toFixed(3)}</span>
                  <span className="w-full text-zinc-600">{f.basis}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="border-t border-zinc-800 pt-3 text-xs leading-relaxed text-zinc-600">
          Esta herramienta no predice con certeza el resultado en campo: los coeficientes son
          simplificaciones. Para decisiones criticas, combine la simulacion con mediciones nuevas y
          criterio tecnico.
        </p>
      </div>
    </details>
  );
}
