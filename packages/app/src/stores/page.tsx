import useSWR, { SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

import { apiv3Get } from '~/client/util/apiv3-client';
import { HasObjectId } from '~/interfaces/has-object-id';

import { IPage, IPageInfo } from '~/interfaces/page';
import { IPagingResult } from '~/interfaces/paging-result';

import { useIsGuestUser } from './context';


export const useSWRxPageByPath = (path: string, initialData?: IPage): SWRResponse<IPage & HasObjectId, Error> => {
  return useSWR(
    ['/page', path],
    (endpoint, path) => apiv3Get(endpoint, { path }).then(result => result.data.page),
    {
      fallbackData: initialData,
    },
  );
};


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSWRxRecentlyUpdated = (): SWRResponse<(IPage & HasObjectId)[], Error> => {
  return useSWR(
    '/pages/recent',
    endpoint => apiv3Get<{ pages:(IPage & HasObjectId)[] }>(endpoint).then(response => response.data?.pages),
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSWRxPageList = (
    path: string,
    pageNumber?: number,
): SWRResponse<IPagingResult<IPage>, Error> => {
  const page = pageNumber || 1;
  return useSWR(
    `/pages/list?path=${path}&page=${page}`,
    endpoint => apiv3Get<{pages: IPage[], totalCount: number, limit: number}>(endpoint).then((response) => {
      return {
        items: response.data.pages,
        totalCount: response.data.totalCount,
        limit: response.data.limit,
      };
    }),
  );
};

type GetSubscriptionStatusResult = { subscribing: boolean };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSWRxSubscriptionStatus = <Data, Error>(pageId: string): SWRResponse<{status: boolean | null}, Error> => {
  const { data: isGuestUser } = useIsGuestUser();
  const key = isGuestUser === false ? ['/page/subscribe', pageId] : null;
  return useSWR(
    key,
    (endpoint, pageId) => apiv3Get<GetSubscriptionStatusResult>(endpoint, { pageId }).then((response) => {
      return {
        status: response.data.subscribing,
      };
    }),
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useSWRxPageInfo = (
    pageId: string | null | undefined,
    shareLinkId?: string | null,
): SWRResponse<IPageInfo, Error> => {

  // assign null if shareLinkId is undefined in order to identify SWR key only by pageId
  const fixedShareLinkId = shareLinkId ?? null;

  return useSWRImmutable(
    pageId != null ? ['/page/info', pageId, fixedShareLinkId] : null,
    (endpoint, pageId, shareLinkId) => apiv3Get(endpoint, { pageId, shareLinkId }).then(response => response.data),
  );
};
