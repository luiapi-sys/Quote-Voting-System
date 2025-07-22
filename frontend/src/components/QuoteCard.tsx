import React from "react";
import type { Quote } from "../types";
import "./QuoteCard.css";

interface QuoteCardProps {
  quote: Quote;
  onVote: (id: string) => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onVote }) => {
  // As per requirements, voting is only allowed if votes are 0
  const canVote = quote.voteCount === 0;

  return (
    <div className="quote-card">
      <p className="quote-text">"{quote.text}"</p>
      <p className="quote-author">- {quote.author}</p>
      <div className="quote-meta">
        <span>Votes: {quote.voteCount}</span>
        <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
      </div>
      <button
        onClick={() => onVote(quote.id)}
        disabled={!canVote}
      >
        {canVote ? "Vote" : "Voted"}
      </button>
    </div>
  );
};

export default QuoteCard;
