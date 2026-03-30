export interface CrawlSuccessResult {
  content?: string;
  contentType: 'text' | 'json';
  description?: string;
  length?: number;
  siteName?: string;
  title?: string;
  url: string;
}

export interface CrawlErrorResult {
  content: string;
  errorMessage: string;
  errorType: string;
  url: string;
}

export interface FilterOptions {
  enableReadability?: boolean;

  pureText?: boolean;
}

type CrawlImplType = 'naive' | 'jina' | 'browserless' | 'search1api';

type CrawlImplParams<T> = T & {
  filterOptions: FilterOptions;
};

export type CrawlImpl<Params = object> = (
  url: string,
  params: CrawlImplParams<Params>,
) => Promise<CrawlSuccessResult | undefined>;

export interface CrawlUrlRule {
  filterOptions?: FilterOptions;
  impls?: CrawlImplType[];
  urlPattern: string;
  urlTransform?: string;
}
