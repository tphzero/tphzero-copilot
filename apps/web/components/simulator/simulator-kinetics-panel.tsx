'use client';

import type { SimulationKineticsInfo } from '@tphzero/domain';
import { LatexMarkdown } from '@/components/simulator/latex-markdown';
import { ChevronDown } from 'lucide-react';

interface SimulatorKineticsPanelProps {
  kinetics: SimulationKineticsInfo;
}

/**
 * Transparencia del motor what-if: k historial, M y desglose multiplicativo.
 * Formulas y unidades en LaTeX (Markdown + KaTeX).
 */
export function SimulatorKineticsPanel({ kinetics }: SimulatorKineticsPanelProps) {
  const { kPerDay, tphInitialMgkg, effectiveRateMultiplier, referenceTiempoDias, factors } =
    kinetics;

  const tphFormatted = tphInitialMgkg.toLocaleString('es-ES', { maximumFractionDigits: 1 });
  const kBlock =
    kPerDay < 1e-8
      ? '**$k$ (historial):** no disponible ($k \\approx 0$).'
      : `**$k$ (historial):** $k = ${kPerDay.toExponential(4)}~\\mathrm{d}^{-1}$.`;

  const intro1 =
    'La **linea base** sigue una degradacion exponencial ajustada solo al historial: se estima $k$ ' +
    '($\\mathrm{d}^{-1}$) por regresion lineal sobre $\\ln(\\mathrm{TPH}/\\mathrm{TPH}_0)$ frente a $t$. ' +
    'El **escenario simulado** usa el mismo $\\mathrm{TPH}_0$ y el mismo $k$, pero la tasa efectiva es ' +
    `$k \\cdot M$, donde $M$ resume el efecto de los sliders respecto a la ultima medicion (referencia en ` +
    `$t = ${referenceTiempoDias}~\\mathrm{d}$).`;

  const intro2 =
    'Cada factor es un cociente $f_i(\\mathrm{sim})/f_i(\\mathrm{ref}) \\approx 1$ si no cambias ese control. ' +
    'El producto $\\prod_i r_i$ se acota para evitar valores extremos. Esto sigue ideas estandar en ' +
    'biorremediacion: temperatura con regla $Q_{10}$; oxigeno y nutrientes con saturacion tipo Monod; ' +
    'humedad con un factor maximo en torno a un rango operativo; volteo como proxy de mezcla y aeracion.';

  const disclaimer =
    'Esta herramienta **no** predice con certeza el resultado en campo: los coeficientes ($Q_{10}$, $K$ de Monod, etc.) son simplificaciones. Para decisiones criticas, combine la simulacion con mediciones nuevas y criterio tecnico.';

  return (
    <details className="group rounded-lg border border-border bg-background/50 open:bg-card/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground marker:content-none hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
        <span>Como se calcula el escenario simulado</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="space-y-4 border-t border-border px-4 pb-4 pt-2 text-sm text-muted-foreground">
        <LatexMarkdown content={intro1} />
        <LatexMarkdown className="text-muted-foreground" content={intro2} />

        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded border border-border/80 bg-card/40 p-3">
            <LatexMarkdown
              content={`**$\\mathrm{TPH}_{0}$ (serie):** $${tphFormatted}~\\mathrm{mg\\,kg}^{-1}$.`}
            />
          </div>
          <div className="rounded border border-border/80 bg-card/40 p-3">
            <LatexMarkdown content={kBlock} />
          </div>
          <div className="rounded border border-border/80 bg-card/40 p-3 sm:col-span-2">
            <LatexMarkdown
              content={`**$M$ (multiplicador operativo):** $M = ${effectiveRateMultiplier.toFixed(3)}$.`}
            />
          </div>
        </dl>

        {factors.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Factores respecto a la referencia
            </p>
            <ul className="max-h-48 space-y-2 overflow-y-auto text-xs">
              {factors.map((f) => (
                <li
                  key={f.id}
                  className="border-b border-border/60 py-2 last:border-0"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <LatexMarkdown inline className="text-foreground/85" content={f.label} />
                    <LatexMarkdown
                      inline
                      className="font-mono text-foreground"
                      content={`$r \\approx ${f.ratio.toFixed(3)}$`}
                    />
                  </div>
                  <div className="mt-1">
                    <LatexMarkdown className="text-muted-foreground [&_p]:text-xs" content={f.basis} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="border-t border-border pt-3">
          <LatexMarkdown className="text-xs text-muted-foreground [&_p]:text-xs" content={disclaimer} />
        </div>
      </div>
    </details>
  );
}
