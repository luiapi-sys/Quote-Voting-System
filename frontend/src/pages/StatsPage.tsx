import React, { useEffect, useState } from "react";
import axios from "../utils/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

type Quote = {
  id: number;
  content: string;
  totalVotes: number;
};

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#8dd1e1",
  "#d0ed57",
];

export default function StatsPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    axios.get("/quotes").then((res) => {
      setQuotes(res.data.quotes);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">📈 สถิติการโหวต (Vote Stats)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="border rounded p-4 shadow">
          <h2 className="text-lg mb-2">Bar Chart: คะแนนโหวตแต่ละคำคม</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={quotes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="content"
                tickFormatter={(v) => v.slice(0, 10) + "..."}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalVotes" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="border rounded p-4 shadow">
          <h2 className="text-lg mb-2">Pie Chart: สัดส่วนคะแนนโหวต</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={quotes}
                dataKey="totalVotes"
                nameKey="content"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.content.slice(0, 10) + "..."}
              >
                {quotes.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
