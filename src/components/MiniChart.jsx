'use client';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

export default function MiniChart({ data, dataKey, stroke, unit }) {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-[10px] text-slate-300">No Data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-600">{`${payload[0].value}${unit}`}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={stroke} 
          strokeWidth={2} 
          dot={false} 
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}