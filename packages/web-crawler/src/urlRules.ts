import { CrawlUrlRule } from './type';

export const crawUrlRules: CrawlUrlRule[] = [
  {
    impls: ['search1api'],
    urlPattern: 'https://weixin.sogou.com/link(.*)',
  },
  {
    impls: ['search1api'],
    urlPattern: 'https://sogou.com/link(.*)',
  },
  {
    impls: ['search1api'],
    urlPattern: 'https://www.youtube.com/watch(.*)',
  },
  {
    impls: ['search1api'],
    urlPattern: 'https://www.reddit.com/r/(.*)/comments/(.*)',
  },
  {
    impls: ['search1api', 'jina'],
    urlPattern: 'https://mp.weixin.qq.com(.*)',
  },
  {
    filterOptions: {
      enableReadability: false,
    },
    impls: ['naive', 'jina'],
    urlPattern: 'https://github.com/([^/]+)/([^/]+)/blob/([^/]+)/(.*)',
    urlTransform: 'https://github.com/$1/$2/raw/refs/heads/$3/$4',
  },
  {
    filterOptions: {
      enableReadability: false,
    },
    impls: ['naive', 'jina'],
    urlPattern: 'https://github.com/(.*)/discussions/(.*)',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://(.*).pdf',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://arxiv.org/pdf/(.*)',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://zhuanlan.zhihu.com(.*)',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://zhihu.com(.*)',
  },
  {
    urlPattern: 'https://medium.com/(.*)',
    urlTransform: 'https://scribe.rip/$1',
  },
  {
    filterOptions: {
      enableReadability: false,
    },
    impls: ['jina', 'browserless'],
    urlPattern: 'https://(twitter.com|x.com)/(.*)',
  },
  {
    filterOptions: {
      enableReadability: false,
      pureText: true,
    },
    impls: ['naive'],
    urlPattern: 'https://www.qiumiwu.com/standings/(.*)',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://developer.mozilla.org(.*)',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://cvpr.thecvf.com(.*)',
  },
  {
    impls: ['jina'],
    urlPattern: 'https://(.*).feishu.cn/(.*)',
  },
  {
    impls: ['search1api', 'jina'],
    urlPattern: 'https://(.*).xiaohongshu.com/(.*)',
  },
];
