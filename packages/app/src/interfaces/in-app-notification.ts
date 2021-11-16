// refer types https://github.com/crowi/crowi/blob/eecf2bc821098d2516b58104fe88fae81497d3ea/client/types/crowi.d.ts
export interface IInAppNotification {
  _id: string
  user: string
  targetModel: 'Page'
  target: any /* Need to set "Page" as a type" */
  action: 'COMMENT' | 'LIKE'
  status: string
  actionUsers: any[] /* Need to set "User[]" as a type" */
  createdAt: string
}

/*
* Note:
* Need to use mongoose PaginateResult as a type after upgrading mongoose v6.0.0.
* Until then, use the original "PagenateResult".
*/
export interface PagenateResult<T> {
  docs: T[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
  nextPage: number | null;
  offset: number;
  page: number;
  pagingCounter: number;
  prevPage: number | null;
  totalDocs: number;
  totalPages: number;
}
