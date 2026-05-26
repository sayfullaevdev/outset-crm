"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WeeklyOrdersChartProps = {
  data: Array<{
    week: string;
    count: number;
  }>;
};

export function WeeklyOrdersChart({ data }: WeeklyOrdersChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Заказы по неделям</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 sm:h-72">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
                <XAxis dataKey="week" stroke="currentColor" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="currentColor" width={28} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
