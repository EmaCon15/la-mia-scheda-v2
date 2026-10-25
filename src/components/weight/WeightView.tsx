import React, { useState, useMemo } from 'react';
import { WeightEntry } from '../../types';
import { calculateWeightDelta } from '../../utils/workoutUtils';
import { ConfirmModal } from '../ui/ConfirmModal';
import {
  Scale,
  Plus,
  Calendar,
  TrendingDown,
  TrendingUp,
  Minus,
  Trash2,
  LineChart,
} from 'lucide-react';

interface WeightViewProps {
  entries: WeightEntry[];
  onSaveWeight: (entry: WeightEntry) => Promise<void>;
  onDeleteWeight: (entryId: string) => Promise<void>;
  loading: boolean;
}

export const WeightView: React.FC<WeightViewProps> = ({
  entries,
  onSaveWeight,
  onDeleteWeight,
  loading,
}) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WeightEntry | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    weight: number;
    delta: number | null;
  } | null>(null);

  // Compute entries with deltas (descending for history list)
  const historyWithDelta = useMemo(() => {
    return calculateWeightDelta(entries);
  }, [entries]);

  // Compute entries sorted ascending for the chart
  const chartData = useMemo(() => {
    return [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [entries]);

  // Key stats
  const currentEntry = historyWithDelta[0] || null;
  const initialEntry = historyWithDelta[historyWithDelta.length - 1] || null;
  const totalChange =
    currentEntry && initialEntry && historyWithDelta.length > 1
      ? Number((currentEntry.weightKg - initialEntry.weightKg).toFixed(1))
      : null;

  const weights = entries.map((e) => e.weightKg);
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weightKg.replace(',', '.'));
    if (isNaN(weightNum) || weightNum <= 20 || weightNum >= 300) {
      alert('Inserisci un peso valido in kg (es. 74.5)');
      return;
    }

    try {
      setIsSubmitting(true);
      const newEntry: WeightEntry = {
        id: `wt-${Date.now()}`,
        userId: '',
        date,
        weightKg: Number(weightNum.toFixed(1)),
        notes: notes.trim() ? notes.trim() : undefined,
        createdAt: new Date().toISOString(),
      };
      await onSaveWeight(newEntry);
      setWeightKg('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Monitoraggio Peso Corporeo
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Registra le tue pesate e controlla l'andamento nel tempo
        </p>
      </div>

      {/* Stats Summary Cards */}
      {currentEntry && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Current weight */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Ultima pesata
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {currentEntry.weightKg}
              </span>
              <span className="text-xs font-bold text-zinc-400">kg</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              {currentEntry.date}
            </span>
          </div>

          {/* Delta vs previous */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Rispetto alla precedente
            </span>
            <div className="flex items-center space-x-1 mt-1">
              {currentEntry.delta !== null ? (
                <>
                  {currentEntry.delta > 0 ? (
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                  ) : currentEntry.delta < 0 ? (
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Minus className="w-5 h-5 text-zinc-400" />
                  )}
                  <span
                    className={`text-xl font-black ${
                      currentEntry.delta > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : currentEntry.delta < 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    {currentEntry.delta > 0 ? `+${currentEntry.delta}` : currentEntry.delta}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">kg</span>
                </>
              ) : (
                <span className="text-sm font-bold text-zinc-400">Primo dato</span>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Variazione recente
            </span>
          </div>

          {/* Total change */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Variazione totale
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span
                className={`text-2xl font-black ${
                  totalChange && totalChange < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : totalChange && totalChange > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {totalChange !== null
                  ? totalChange > 0
                    ? `+${totalChange}`
                    : totalChange
                  : '0.0'}
              </span>
              <span className="text-xs font-bold text-zinc-400">kg</span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Dalla prima pesata
            </span>
          </div>

          {/* Range min/max */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 border border-zinc-200 dark:border-zinc-800 shadow-xs">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block">
              Range registrato
            </span>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Min: {minWeight}kg
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Max: {maxWeight}kg
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              {entries.length} pesate totali
            </span>
          </div>
        </div>
      )}

      {/* New Weight Record Form */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-3 flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span>Nuova Misurazione Peso</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Weight Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Peso corporeo (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Es. 74.5"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                />
                <span className="absolute right-3.5 top-3 text-xs font-bold text-zinc-400">
                  kg
                </span>
              </div>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Note (facoltative)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Es. A digiuno mattina"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!weightKg || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Salva Pesata</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Weight Chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <LineChart className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Andamento del Peso
            </h3>
          </div>

          {hoveredPoint && (
            <div className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
              <span className="font-bold">{hoveredPoint.date}: </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                {hoveredPoint.weight} kg
              </span>
            </div>
          )}
        </div>

        {chartData.length < 2 ? (
          <div className="py-12 text-center text-xs text-zinc-400 italic">
            Registra almeno 2 pesate con date differenti per visualizzare il grafico dell'andamento.
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <WeightSVGChart
              data={chartData}
              onHoverPoint={(pt) => setHoveredPoint(pt)}
            />
          </div>
        )}
      </div>

      {/* Chronological History Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
          Storico Cronologico ({historyWithDelta.length})
        </h3>

        {historyWithDelta.length === 0 && !loading && (
          <p className="text-xs text-zinc-400 py-4 text-center italic">
            Nessuna pesata registrata. Inizia inserendo il tuo peso sopra.
          </p>
        )}

        <div className="space-y-2">
          {historyWithDelta.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center shrink-0">
                  {entry.weightKg}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {entry.date}
                    </span>
                    {entry.delta !== null && (
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                          entry.delta > 0
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : entry.delta < 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-zinc-200/50 text-zinc-600'
                        }`}
                      >
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta} kg
                      </span>
                    )}
                  </div>
                  {entry.notes && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                      {entry.notes}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDeleteTarget(entry)}
                aria-label={`Elimina pesata del ${entry.date}`}
                className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Elimina Misurazione Peso"
        message={
          deleteTarget
            ? `Sei sicuro di voler eliminare la pesata del ${deleteTarget.date} (${deleteTarget.weightKg} kg)? L'operazione non può essere annullata.`
            : ''
        }
        confirmLabel="Elimina Pesata"
        onConfirm={async () => {
          if (deleteTarget) {
            const idToDelete = deleteTarget.id;
            setDeleteTarget(null);
            await onDeleteWeight(idToDelete);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

interface WeightSVGChartProps {
  data: WeightEntry[];
  onHoverPoint: (pt: { date: string; weight: number; delta: number | null } | null) => void;
}

const WeightSVGChart: React.FC<WeightSVGChartProps> = ({ data, onHoverPoint }) => {
  if (data.length < 2) return null;

  const weights = data.map((d) => d.weightKg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  // Add a slight padding so points don't clip the edges
  const paddingY = Math.max(0.5, (maxW - minW) * 0.15);
  const effectiveMin = minW - paddingY;
  const effectiveMax = maxW + paddingY;
  const rangeY = effectiveMax - effectiveMin || 1;

  const width = 600;
  const height = 200;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.weightKg - effectiveMin) / rangeY) * chartHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${
    paddingTop + chartHeight
  } L ${points[0].x} ${paddingTop + chartHeight} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-48 select-none overflow-visible"
    >
      <defs>
        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Horizontal guide lines */}
      {[0, 0.5, 1].map((ratio, i) => {
        const y = paddingTop + chartHeight * ratio;
        const val = (effectiveMax - ratio * rangeY).toFixed(1);
        return (
          <g key={i}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              stroke="currentColor"
              className="text-zinc-200 dark:text-zinc-800"
              strokeDasharray="4 4"
            />
            <text
              x={paddingLeft - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[10px] fill-zinc-400 font-mono"
            >
              {val}
            </text>
          </g>
        );
      })}

      {/* Area fill under curve */}
      <path d={areaD} fill="url(#weightGradient)" />

      {/* Main trend line */}
      <path
        d={pathD}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Interactive data points */}
      {points.map((pt, i) => (
        <g
          key={i}
          className="cursor-pointer group"
          onMouseEnter={() =>
            onHoverPoint({
              date: pt.data.date,
              weight: pt.data.weightKg,
              delta: null,
            })
          }
          onMouseLeave={() => onHoverPoint(null)}
        >
          <circle
            cx={pt.x}
            cy={pt.y}
            r="5"
            className="fill-white dark:fill-zinc-900 stroke-emerald-500 stroke-[3] group-hover:scale-125 transition-transform"
          />
          {/* Label for start and end */}
          {(i === 0 || i === points.length - 1 || points.length <= 6) && (
            <text
              x={pt.x}
              y={height - 10}
              textAnchor="middle"
              className="text-[9px] fill-zinc-400 font-mono"
            >
              {pt.data.date.substring(5)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};
