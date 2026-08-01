'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ChartData {
  report_date: string;
  total_revenue: number;
}

interface DashboardChartProps {
  data: ChartData[];
}

// Tooltip tùy chỉnh chuẩn Material 3
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const originalDate = payload[0].payload.report_date;
    return (
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-lg">
        <p className="text-xs text-slate-500 mb-1">{format(new Date(originalDate), 'dd/MM/yyyy')}</p>
        <p className="text-sm font-bold text-slate-900">{`${payload[0].value.toLocaleString('vi-VN')}đ`}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardChart({ data }: DashboardChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.report_date), 'dd/MM'),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={formattedData}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0B57D0" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#0B57D0" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          axisLine={{ stroke: '#E2E8F0' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => `${(value as number / 1000000).toFixed(1)}tr`}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0B57D0', strokeWidth: 1, strokeDasharray: '5 5' }} />
        <Area type="monotone" dataKey="total_revenue" stroke="#0B57D0" strokeWidth={2.5} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: '#0B57D0', stroke: '#fff', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}