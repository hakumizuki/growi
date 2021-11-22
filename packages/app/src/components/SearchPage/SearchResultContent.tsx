import React, { FC } from 'react';

import RevisionLoader from '../Page/RevisionLoader';
import AppContainer from '../../client/services/AppContainer';
import SearchResultContentSubNavigation from './SearchResultContentSubNavigation';

// TODO : set focusedPage type to ?IPageSearchResultData once #80214 is merged
// PR: https://github.com/weseek/growi/pull/4649

type Props ={
  appContainer: AppContainer,
  searchingKeyword:string,
  focusedPage: null | any,
}


const SearchResultContent: FC<Props> = (props: Props) => {
  const page = props.focusedPage;
  if (page == null) return null;
  const growiRenderer = props.appContainer.getRenderer('searchresult');
  let showTags = false;
  if (page.tags != null && page.tags.length > 0) { showTags = true }
  return (
    <div key={page._id} className="search-result-page mb-5">
      <SearchResultContentSubNavigation
        pageId={page._id}
        revisionId={page.revision}
        path={page.path}
      >
      </SearchResultContentSubNavigation>
      <RevisionLoader
        growiRenderer={growiRenderer}
        pageId={page._id}
        pagePath={page.path}
        revisionId={page.revision}
        highlightKeywords={props.searchingKeyword}
      />
    </div>
  );
};


export default SearchResultContent;
