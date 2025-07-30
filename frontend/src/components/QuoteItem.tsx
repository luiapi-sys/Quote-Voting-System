// components/QuoteItem.tsx
import { useState } from "react";
import axios from "../utils/axios";

export interface Quote {
  id: number;
  content: string;
  author: string;
  totalVotes: number;
  currentUserVote: number; // 0 = ยังไม่โหวต, 1 = โหวตแล้ว
  createdBy: { id: number; username: string };
}

interface QuoteItemProps {
  quote: Quote;
  onVoteUpdate?: (updatedQuote: Quote) => void;
}

export default function QuoteItem({ quote, onVoteUpdate }: QuoteItemProps) {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    try {
      setIsVoting(true);
      const res = await axios.post(`/quotes/${quote.id}/vote`);
      const updatedQuote = {
        ...quote,
        totalVotes: res.data.totalVotes,
        currentUserVote: res.data.currentUserVote,
      };
      onVoteUpdate?.(updatedQuote);
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="p-4 border rounded mb-3 flex justify-between items-center bg-white shadow">
      <div>
        <p className="text-lg font-semibold">{quote.content}</p>
        <p className="text-sm text-gray-500">โดย {quote.createdBy.username}</p>
        <p className="text-sm text-blue-600">คะแนนโหวต: {quote.totalVotes}</p>
      </div>
      <button
        className={`px-4 py-1 rounded ${
          quote.currentUserVote > 0 ? "bg-red-500" : "bg-green-500"
        } text-white disabled:opacity-50`}
        onClick={handleVote}
        disabled={isVoting}
      >
        {quote.currentUserVote > 0 ? "Unvote" : "Vote"}
      </button>
    </div>
  );
}
