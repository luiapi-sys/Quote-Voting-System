import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Quote } from '../types/quote';

export default function VoteChart({ quotes }: { quotes: Quote[] }) {
  const data = quotes.map((q) => ({
    name: q.content.slice(0, 15) + '...',
    votes: q.totalVotes,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="votes" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
