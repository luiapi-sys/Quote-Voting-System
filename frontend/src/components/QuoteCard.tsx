import { Quote } from '../types/quote';

export default function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <div className="p-4 border rounded shadow-sm">
      <p className="text-lg">{quote.content}</p>
      <p className="text-sm text-gray-500">— {quote.author}</p>
      <p className="text-right text-blue-500">❤️ {quote.totalVotes}</p>
    </div>
  );
}
