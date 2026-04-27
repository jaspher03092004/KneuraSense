'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line,
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, ComposedChart,
  Legend
} from 'recharts';

// SHARED HELPER COMPONENTS & DYNAMIC COLORS
const EmptyChart = () => (
  <div className="h-full flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-600">Collecting Data...</div>
);

const CriticalEventDot = (props) => {
  const { cx, cy, payload, threshold = 75 } = props;
  const riskValue = payload.risk !== undefined ? payload.risk : payload.score;
  
  if (riskValue >= threshold) {
    return <circle cx={cx} cy={cy} r={4} stroke="white" strokeWidth={1.5} fill="#f43f5e" className="animate-pulse" />;
  }
  return null;
};

// DYNAMIC COLOR ASSIGNMENT
const STATE_PALETTE = [
  '#0ea5e9', // Sky Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#84cc16'  // Lime
];

const assignedColors = new Map();

const getAiStateColor = (state) => {
  if (!state) return '#94a3b8';
  const normalizedState = String(state).toUpperCase();
  if (!assignedColors.has(normalizedState)) {
    const nextColor = STATE_PALETTE[assignedColors.size % STATE_PALETTE.length];
    assignedColors.set(normalizedState, nextColor);
  }
  return assignedColors.get(normalizedState);
};

const formatStateName = (state) => {
  if (!state) return 'Unknown';
  return String(state)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

// TOOLTIPS
const CustomTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800 min-w-[90px] transition-colors duration-300">
        {data.time && <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">{data.time}</p>}
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{`${payload[0].value?.toFixed(1) || payload[0].value}${unit}`}</p>
      </div>
    );
  }
  return null;
};

const CustomRiskTooltip = ({ active, payload, label, threshold = 75 }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const score = data.score !== undefined ? data.score : data.risk;
    const isCritical = score >= threshold;

    return (
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 min-w-[160px] transition-colors duration-300">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2">{label}</p>
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Risk Score</span>
          <span className={`text-xl font-black ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
            {score}
          </span>
        </div>
        {isCritical && (
          <div className="mt-3 pt-3 border-t border-rose-100 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 -mx-3 -mb-3 p-3 rounded-b-xl transition-colors duration-300">
            <p className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 mb-2 tracking-wider flex items-center gap-1">High Risk Event!</p>
            {data.aiState && <p className="text-[10px] font-bold text-rose-600 dark:text-rose-300 mb-2">Detected: {formatStateName(data.aiState)}</p>}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">Angle</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{data.angle?.toFixed(1)}°</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">Load</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{data.force} N</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomScatterTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-xl text-white text-xs">
        <p className="font-bold mb-1 border-b border-slate-700 pb-1">Biomechanical Event</p>
        <p>Flexion: <span className="font-bold text-blue-400">{p.angle.toFixed(1)}°</span></p>
        <p>Load: <span className="font-bold text-sky-400">{p.force} N</span></p>
        <p>Risk: <span className="font-bold text-amber-400">{p.risk}/100</span></p>
      </div>
    );
  }
  return null;
};

// 1. PATIENT CHARTS
export default function HistoryCharts({ data, riskThreshold = 75 }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <div className="w-full h-full min-h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
          <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomRiskTooltip threshold={riskThreshold} />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <ReferenceLine y={riskThreshold} stroke="orange" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Area type="monotone" dataKey={data[0]?.score !== undefined ? "score" : "risk"} stroke="#f43f5e" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} dot={<CriticalEventDot />} activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MiniLineChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeOpacity: 0.5 }} />
        <Line type="monotone" dataKey="val" stroke={stroke} strokeWidth={2.5} dot={false} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MiniAreaChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`colorArea-${stroke}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeOpacity: 0.5 }} />
        <Area type="monotone" dataKey="val" stroke={stroke} fill={`url(#colorArea-${stroke})`} strokeWidth={2.5} animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MiniBarChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: '#cbd5e1', opacity: 0.2 }} />
        <Bar dataKey="val" fill={stroke} radius={[2, 2, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 2. CLINICIAN CDSS CHARTS
export function RiskDonutChart({ data }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#1e293b', fontWeight: 'bold' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function OveruseComposedChart({ data }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="forceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
        <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} domain={[0, 100]} />
        <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomOveruseTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <ReferenceLine yAxisId="left" y={70} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.5} />
        <Area yAxisId="right" type="monotone" dataKey="force" name="Load (N)" fill="url(#forceGradient)" stroke="#0ea5e9" strokeWidth={2} />
        <Line yAxisId="left" type="monotone" dataKey="risk" name="Risk Score" stroke="#f59e0b" strokeWidth={3} dot={<CriticalEventDot />} activeDot={{ r: 6 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function BiomechanicalScatterChart({ data }) {
  if (!data || data.length === 0) return <EmptyChart />;
  const scatterData = data.map(d => ({
    angle: d.angle,
    force: d.force,
    risk: d.risk,
    fill: d.risk >= 70 ? '#f43f5e' : d.risk >= 40 ? '#f59e0b' : '#10b981'
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
        <XAxis type="number" dataKey="angle" name="Angle" unit="°" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
        <YAxis type="number" dataKey="force" name="Force" unit="N" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <ZAxis type="number" dataKey="risk" range={[40, 400]} />
        <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={scatterData} fill="#8884d8">
          {scatterData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} opacity={0.8} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

// 3. ACTIVITY CHARTS - UNIFIED TOOLTIP & FORMATTING
export function ActivityDistributionChart({ data }) {
  if (!data || data.length === 0) return <EmptyChart />;
  const formattedData = data.map(d => ({
    ...d,
    name: formatStateName(d.state),
    value: d.count,
    fill: getAiStateColor(d.state)
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={formattedData} innerRadius="45%" outerRadius="75%" paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
          {formattedData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
        </Pie>
        {/* Unified Tooltip Design */}
        <Tooltip content={<CustomTimelineTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          align="center" 
          layout="horizontal" 
          iconSize={8} 
          iconType="circle" 
          wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px', bottom: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2px' }} 
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function ActivityTimelineChart({ data }) {
  if (!data || data.length === 0) return <EmptyChart />;
  const dynamicStates = Array.from(new Set(data.flatMap(Object.keys).filter(key => key !== 'time')));
  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* Corrected padding/margins for Clinician Portal */}
      <BarChart data={data} margin={{ top: 10, right: 20, left: -15, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
        <XAxis dataKey="time" tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTimelineTooltip />} cursor={{ fill: '#cbd5e1', opacity: 0.1 }} />
        <Legend 
          verticalAlign="bottom" 
          align="center" 
          layout="horizontal" 
          iconSize={8} 
          iconType="circle" 
          wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '20px', bottom: -15, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }} 
        />
        {dynamicStates.map((stateKey) => (
          <Bar key={stateKey} dataKey={stateKey} stackId="a" fill={getAiStateColor(stateKey)} name={formatStateName(stateKey)} radius={[2, 2, 2, 2]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

const CustomTimelineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    return (
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg shadow-xl border border-slate-100 dark:border-slate-800 transition-colors duration-300 z-50 min-w-[130px]">
        {label && <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">{label}</p>}
        <div className="space-y-1.5">
          {sortedPayload.map((entry, index) => entry.value > 0 && (
            <div key={index} className="flex justify-between items-center gap-4">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }}></span> 
                {entry.name}
              </span>
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CustomOveruseTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 dark:border-slate-800 min-w-[160px] transition-colors duration-300">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
        <div className="space-y-2 mt-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span> Risk Score
            </span>
            <span className={`text-sm font-black ${data.risk >= 70 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>{data.risk}</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0ea5e9]"></span> Force (N)
            </span>
            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{data.force} N</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};