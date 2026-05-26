"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MonthlyPerformanceChartProps = {
  data: Array<{
    month: string;
    revenue: number;
    profit: number;
  }>;
};

export function MonthlyPerformanceChart({ data }: MonthlyPerformanceChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выручка и прибыль по месяцам</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="currentColor" tick={{ fontSize: 12 }} />
                <YAxis stroke="currentColor" width={32} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Выручка" />
                <Bar dataKey="profit" fill="#10b981" radius={[6, 6, 0, 0]} name="Прибыль" />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
