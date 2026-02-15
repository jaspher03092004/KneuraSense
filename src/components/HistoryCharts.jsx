'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line,
  BarChart, Bar
} from 'recharts';

// --- NEW: Event Marker Custom Dot ---
const CriticalEventDot = (props) => {
  const { cx, cy, payload } = props;
  // Only draw a dot if the score is in the critical zone
  if (payload.score >= 70) {
    return (
      <circle cx={cx} cy={cy} r={4} stroke="white" strokeWidth={1.5} fill="#f43f5e" className="animate-pulse" />
    );
  }
  return null;
};

// --- NEW: Custom Diagnostic Tooltip ---
const CustomRiskTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isCritical = data.score >= 70;

    return (
      <div className="bg-white p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 min-w-[160px]">
        <p className="text-xs font-bold text-slate-400 mb-2">{label}</p>
        
        <div className="flex justify-between items-end mb-1">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Risk Score</span>
          <span className={`text-xl font-black ${isCritical ? 'text-rose-600' : 'text-slate-800'}`}>
            {data.score}
          </span>
        </div>

        {/* If it's a spike, show the diagnostic breakdown */}
        {isCritical && (
          <div className="mt-3 pt-3 border-t border-rose-100 bg-rose-50 -mx-3 -mb-3 p-3 rounded-b-xl">
            <p className="text-[10px] font-black uppercase text-rose-500 mb-2 tracking-wider flex items-center gap-1">
              High Risk Event!
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Angle</p>
                <p className="text-xs font-bold text-slate-800">{data.angle?.toFixed(1)}°</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Load</p>
                <p className="text-xs font-bold text-slate-800">{data.force} N</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * Main detailed chart for Trend Analysis
 */
export default function HistoryCharts({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400 text-sm">
        No data available for chart
      </div>
    );
  }

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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="time" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
          <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} domain={[0, 100]} />
          
          {/* ---> THIS IS THE LINE THAT WAS FIXED <--- */}
          <Tooltip content={<CustomRiskTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
          
          <ReferenceLine y={70} stroke="orange" strokeDasharray="3 3" />
          {/* Apply the Custom Dot Here */}
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#f43f5e" 
            fillOpacity={1} 
            fill="url(#colorRisk)" 
            strokeWidth={3} 
            dot={<CriticalEventDot />} 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- 1. Mini Line Chart (Best for Angle & Temp) ---
export function MiniLineChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
        <Line type="monotone" dataKey="val" stroke={stroke} strokeWidth={2.5} dot={false} animationDuration={800} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// --- 2. Mini Area Chart (Best for Heart Rate) ---
export function MiniAreaChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`fill${stroke}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={stroke} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
        <Area type="monotone" dataKey="val" stroke={stroke} fill={`url(#fill${stroke})`} strokeWidth={2.5} animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// --- 3. Mini Bar Chart (Best for Pressure or Force) ---
export function MiniBarChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="val" fill={stroke} radius={[2, 2, 0, 0]} animationDuration={800} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Shared Tooltip for Mini Charts ---
const CustomTooltip = ({ active, payload, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-100 min-w-[90px]">
        {/* Now shows the synchronized time! */}
        {data.time && <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">{data.time}</p>}
        <p className="text-xs font-bold text-slate-700">{`${payload[0].value.toFixed(1)}${unit}`}</p>
      </div>
    );
  }
  return null;
};

const EmptyChart = () => (
  <div className="h-full flex items-center justify-center text-[10px] text-slate-300">Collecting Data...</div>
);