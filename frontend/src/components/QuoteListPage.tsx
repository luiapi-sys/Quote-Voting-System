import { useNavigate } from "react-router-dom";
import { useState } from "react";
import QuoteCard from "./QuoteCard";
import type { Quote } from "../types";
import "./QuoteListPage.css";

// Mock data for initial UI development
const mockQuotes: Quote[] = [
  { id: "1", text: "The only way to do great work is to love what you do.", author: "Steve Jobs", voteCount: 5, createdAt: "2023-10-26T10:00:00Z" },
  {
    id: "2",
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    voteCount: 0,
    createdAt: "2023-10-25T12:30:00Z"
  },
  {
    id: "3",
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    voteCount: 12,
    createdAt: "2023-10-24T15:00:00Z"
  }
];

function QuoteListPage() {
  const navigate = useNavigate();
  // We'll use state to manage quotes so the UI can update on vote
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);

  const handleLogout = () => {
    // TODO: Implement actual logout logic
    console.log("Logging out...");
    navigate("/login");
  };

  const handleVote = (id: string) => {
    // Placeholder logic for voting. In a real app, this would be an API call.
    console.log(`Voted for quote with id: ${id}`);
    alert(`You voted for quote ${id}! (This is a placeholder)`);

    // Update the local state to reflect the vote (for UI demo purposes)
    setQuotes((currentQuotes) => currentQuotes.map((q) => (q.id === id ? { ...q, voteCount: q.voteCount + 1 } : q)));
  };

  return (
    <div>
      <div className="header">
        <h1>Quotes</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="quote-list-container">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            onVote={handleVote}
          />
        ))}
      </div>

      {/* TODO: Implement Add/Edit Quote, Lazy loading, Search, Filter, Sorting, and Chart */}
    </div>
  );
}

export default QuoteListPage;
