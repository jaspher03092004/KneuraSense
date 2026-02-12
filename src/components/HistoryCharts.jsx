'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, LineChart, Line
} from 'recharts';

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
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          
          <XAxis 
            dataKey="time" 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{fontSize: 10, fill: '#94a3b8'}} 
            axisLine={false}
            tickLine={false}
            domain={[0, 100]} 
          />
          
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold' }}
          />

          <ReferenceLine y={70} stroke="orange" strokeDasharray="3 3" />

          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#f43f5e" 
            fillOpacity={1} 
            fill="url(#colorRisk)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Simplified chart for Correlation Cards (Terrain/Environment)
 */
export function MiniChart({ data, stroke, unit }) {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-[10px] text-slate-300">Collecting Data...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-600">{`${payload[0].value.toFixed(1)}${unit}`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="val" 
          stroke={stroke} 
          strokeWidth={2.5} 
          dot={false} 
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}