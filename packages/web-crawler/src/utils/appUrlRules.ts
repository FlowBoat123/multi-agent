import { CrawlUrlRule } from '../type';

export const applyUrlRules = (
  url: string,
  urlRules: CrawlUrlRule[],
): {
  filterOptions?: CrawlUrlRule['filterOptions'];
  impls?: string[];
  transformedUrl: string;
} => {
  for (const rule of urlRules) {
    const regex = new RegExp(rule.urlPattern);
    const match = url.match(regex);

    if (match) {
      if (rule.urlTransform) {
        const transformedUrl = rule.urlTransform.replaceAll(
          /\$(\d+)/g,
          (_, index) => match[parseInt(index)] || '',
        );

        return {
          filterOptions: rule.filterOptions,
          impls: rule.impls,
          transformedUrl,
        };
      } else {
        return {
          filterOptions: rule.filterOptions,
          impls: rule.impls,
          transformedUrl: url,
        };
      }
    }
  }

  return { transformedUrl: url };
};
