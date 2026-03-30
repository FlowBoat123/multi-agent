import { CrawlImplType, crawlImpls } from './crawImpl';
import { CrawlUrlRule } from './type';
import { crawUrlRules } from './urlRules';
import { applyUrlRules } from './utils/appUrlRules';

const defaultImpls = ['jina', 'naive', 'search1api', 'browserless'] as CrawlImplType[];

interface CrawlOptions {
  impls?: string[];
}

export class Crawler {
  impls: CrawlImplType[];

  constructor(options: CrawlOptions = {}) {
    this.impls = !!options.impls?.length
      ? (options.impls.filter((impl) => Object.keys(crawlImpls).includes(impl)) as CrawlImplType[])
      : defaultImpls;
  }

  async crawl({
    url,
    impls: userImpls,
    filterOptions: userFilterOptions,
  }: {
    filterOptions?: CrawlUrlRule['filterOptions'];
    impls?: CrawlImplType[];
    url: string;
  }) {
    const {
      transformedUrl,
      filterOptions: ruleFilterOptions,
      impls: ruleImpls,
    } = applyUrlRules(url, crawUrlRules);

    const mergedFilterOptions = {
      ...ruleFilterOptions,
      ...userFilterOptions,
    };

    let finalCrawler: string | undefined;
    let finalError: Error | undefined;

    const systemImpls = (ruleImpls ?? this.impls) as CrawlImplType[];

    const finalImpls = userImpls
      ? (userImpls.filter((impl) => Object.keys(crawlImpls).includes(impl)) as CrawlImplType[])
      : systemImpls;

    for (const impl of finalImpls) {
      try {
        const res = await crawlImpls[impl](transformedUrl, { filterOptions: mergedFilterOptions });

        if (res && res.content && res.content?.length > 100)
          return {
            crawler: impl,
            data: res,
            originalUrl: url,
            transformedUrl: transformedUrl !== url ? transformedUrl : undefined,
          };
      } catch (error) {
        console.error(error);
        finalError = error as Error;
        finalCrawler = impl;
      }
    }

    const errorType = finalError?.name || 'UnknownError';
    const errorMessage = finalError?.message;

    return {
      crawler: finalCrawler,
      data: {
        content: `Fail to crawl the page. Error type: ${errorType}, error message: ${errorMessage}`,
        errorMessage: errorMessage,
        errorType,
      },
      originalUrl: url,
      transformedUrl: transformedUrl !== url ? transformedUrl : undefined,
    };
  }
}
