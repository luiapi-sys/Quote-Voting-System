export interface Quote {
  id: number;
  content: string;
  author: string;
  isActive: boolean;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  createdBy: {
    id: number;
    username: string;
  };
  currentUserVote: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
