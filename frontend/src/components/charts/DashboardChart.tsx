'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { format } from 'date-fns';

interface ChartData {
  report_date: string;
  total_revenue: number;
}

interface DashboardChartProps {
  data: ChartData[];
}

// Component Tooltip tùy chỉnh để hiển thị đẹp hơn
const CustomTooltip = ({ active, payload, label }: any) => {
  // SỬA LỖI: Kiểm tra payload và lấy ngày từ nguồn dữ liệu gốc, không dùng label
  if (active && payload && payload.length) {
    // Lấy ngày tháng nguyên bản từ payload của điểm dữ liệu
    const originalDate = payload[0].payload.report_date;
    return (
      <div className="bg-dark-bg p-3 rounded-lg border border-dark-border shadow-lg">
        <p className="text-sm text-dark-text-secondary">{format(new Date(originalDate), 'dd/MM/yyyy')}</p>
        <p className="font-bold text-brand-amber">{`${payload[0].value.toLocaleString('vi-VN')}đ`}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardChart({ data }: DashboardChartProps) {
  // Định dạng lại dữ liệu để Recharts hiểu
  const formattedData = data.map(item => ({
    ...item,
    // Định dạng ngày cho trục X
    formattedDate: format(new Date(item.report_date), 'dd/MM'),
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={formattedData}
        margin={{
          top: 5,
          right: 20,
          left: 20,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis
          dataKey="formattedDate"
          tick={{ fill: '#A1A1AA' }}
          fontSize={12}
          axisLine={{ stroke: '#3F3F46' }}
          tickLine={{ stroke: '#3F3F46' }}
        />
        <YAxis
          tickFormatter={(value) => `${(value as number / 1000000).toFixed(1)}tr`}
          tick={{ fill: '#A1A1AA' }}
          fontSize={12}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#FBBF24', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey="total_revenue" stroke="#FBBF24" strokeWidth={2} fill="url(#colorRevenue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}