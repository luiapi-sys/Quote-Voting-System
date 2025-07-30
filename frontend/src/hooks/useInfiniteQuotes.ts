import { useState, useEffect } from "react";
import axios from "../utils/axios";
import { Quote } from "../types/quote";

export function useInfiniteQuotes(
  search: string,
  sortBy: string,
  sortOrder: "asc" | "desc"
) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancel = false;

    const load = async () => {
      const res = await axios.get(`/quotes`, {
        params: {
          page,
          limit: 10,
          search,
          sortBy,
          sortOrder,
        },
      });

      if (cancel) return;

      if (page === 1) {
        setQuotes(res.data.quotes);
      } else {
        setQuotes((prev) => [...prev, ...res.data.quotes]);
      }

      setHasMore(page < res.data.pagination.pages);
    };

    load();
    return () => {
      cancel = true;
    };
  }, [page, search, sortBy, sortOrder]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, sortOrder]);



  return { quotes, setPage, hasMore };
}
