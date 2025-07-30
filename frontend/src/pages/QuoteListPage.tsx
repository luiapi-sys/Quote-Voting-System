import { useEffect, useState, useRef, useCallback } from "react";
import axios from "../utils/axios";

type Quote = {
  id: number;
  content: string;
  author: string;
  totalVotes: number;
  currentUserVote: number;
};

export default function QuoteListPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "totalVotes">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchQuotes = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.get("/quotes", {
        params: {
          page: reset ? 1 : page,
          limit: 10,
          search,
          sortBy,
          sortOrder,
        },
      });
      const newQuotes: Quote[] = res.data.quotes;
      setQuotes((prev) => (reset ? newQuotes : [...prev, ...newQuotes]));
      setHasMore(newQuotes.length > 0);
    } catch (err) {
      console.error("Error fetching quotes:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchQuotes(true); // reset on search/sort
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    if (page > 1) fetchQuotes();
  }, [page]);

  const handleVote = async (quoteId: number) => {
    try {
      await axios.post(`/votes/quote/${quoteId}`, {
        value: 1,
      });
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? { ...q, totalVotes: q.totalVotes + 1, currentUserVote: 1 }
            : q
        )
      );
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 mt-6">
      <h1 className="text-2xl font-bold mb-4">📋 รายการคำคม</h1>

      <div className="mb-4 flex gap-2 items-center">
        <input
          type="text"
          placeholder="🔍 ค้นหา..."
          className="border px-3 py-2 rounded w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border px-2 py-2 rounded"
        >
          <option value="createdAt">createdAt</option>
          <option value="totalVotes">totalVotes</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="border px-2 py-2 rounded"
        >
          <option value="desc">⬇ desc</option>
          <option value="asc">⬆ asc</option>
        </select>
      </div>

      {quotes.map((quote, index) => {
        const QuoteBox = (
          <div
            key={quote.id}
            className="border p-4 mb-3 rounded shadow bg-white"
          >
            <p className="text-lg font-medium">{quote.content}</p>
            <div className="text-sm text-gray-500 mt-1">— {quote.author}</div>
            <div className="mt-2 text-sm text-gray-700">
              👍 {quote.totalVotes}
            </div>
            <button
              className={`mt-2 px-3 py-1 rounded text-sm ${
                quote.currentUserVote
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={() => handleVote(quote.id)}
              disabled={!!quote.currentUserVote}
            >
              {quote.currentUserVote ? "โหวตแล้ว" : "Vote 👍"}
            </button>
          </div>
        );

        return index === quotes.length - 1 ? (
          <div ref={lastElementRef} key={quote.id}>
            {QuoteBox}
          </div>
        ) : (
          QuoteBox
        );
      })}

      {loading && <p className="text-center mt-4">⏳ กำลังโหลด...</p>}
      {!hasMore && (
        <p className="text-center mt-4 text-gray-500">📭 แสดงครบแล้ว</p>
      )}
    </div>
  );
}
