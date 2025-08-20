"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type TasksPerBoardDatum = { name: string; tasks: number; done: number };

export default function TasksPerBoardChart({
  data,
}: {
  data: TasksPerBoardDatum[];
}) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="name" hide={false} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="tasks" fill="#6366f1" name="Tasks" />
          <Bar dataKey="done" fill="#22c55e" name="Done" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
