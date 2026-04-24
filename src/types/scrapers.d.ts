declare module 'app-store-scraper' {
  interface ReviewOptions {
    id: string;
    sort: number;
    page?: number;
    country?: string;
  }

  interface ReviewResult {
    id: string;
    userName: string;
    userUrl: string;
    version: string;
    score: number;
    title: string;
    text: string;
    url: string;
    updated: string;
  }

  const sort: {
    RECENT: number;
    HELPFUL: number;
  };

  function reviews(options: ReviewOptions): Promise<ReviewResult[]>;

  export default { sort, reviews };
}

declare module 'google-play-scraper' {
  interface ReviewOptions {
    appId: string;
    sort?: number;
    num?: number;
    lang?: string;
    country?: string;
    paginate?: boolean;
  }

  interface ReviewResult {
    id: string;
    userName: string;
    userImage: string;
    score: number;
    title: string | null;
    text: string;
    thumbsUp: number;
    version: string | null;
    date: string;
    replyDate: string | null;
    replyText: string | null;
  }

  interface ReviewsResponse {
    data: ReviewResult[];
  }

  const sort: {
    NEWEST: number;
    RATING: number;
    HELPFULNESS: number;
  };

  function reviews(options: ReviewOptions): Promise<ReviewsResponse>;

  export default { sort, reviews };
}
