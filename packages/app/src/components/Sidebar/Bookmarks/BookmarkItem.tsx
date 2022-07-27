
import React, { useCallback, useState } from 'react';

import nodePath from 'path';


import { DevidedPagePath, pathUtils } from '@growi/core';
import { useTranslation } from 'react-i18next';
import { UncontrolledTooltip, DropdownToggle } from 'reactstrap';

import { unbookmark } from '~/client/services/page-operation';
import { toastError, toastSuccess } from '~/client/util/apiNotification';
import { apiv3Put } from '~/client/util/apiv3-client';
import { IPageHasId, IPageInfoAll, IPageToDeleteWithMeta } from '~/interfaces/page';
import { OnDeletedFunction } from '~/interfaces/ui';
import { usePageDeleteModal } from '~/stores/modal';


import ClosableTextInput, { AlertInfo, AlertType } from '../../Common/ClosableTextInput';
import { MenuItemType, PageItemControl } from '../../Common/Dropdown/PageItemControl';


type Props = {
  page: IPageHasId,
  refreshBookmarkList: () => void
}

const BookmarkItem = (props: Props): JSX.Element => {
  const { t } = useTranslation();
  const { page, refreshBookmarkList } = props;
  const [isRenameInputShown, setRenameInputShown] = useState(false);
  const dPagePath = new DevidedPagePath(page.path, false, true);
  const { latter: pageTitle, former: formerPagePath } = dPagePath;
  const bookmarkItemId = `bookmark-item-${page._id}`;
  const { open: openDeleteModal } = usePageDeleteModal();

  const bookmarkMenuItemClickHandler = useCallback(async() => {
    await unbookmark(page._id);
    refreshBookmarkList();
  }, [page, refreshBookmarkList]);

  const renameMenuItemClickHandler = useCallback(() => {
    setRenameInputShown(true);
  }, []);

  const inputValidator = (title: string | null): AlertInfo | null => {
    if (title == null || title === '' || title.trim() === '') {
      return {
        type: AlertType.WARNING,
        message: t('form_validation.title_required'),
      };
    }

    return null;
  };

  const pressEnterForRenameHandler = (async(inputText: string) => {
    const parentPath = pathUtils.addTrailingSlash(nodePath.dirname(page.path ?? ''));
    const newPagePath = nodePath.resolve(parentPath, inputText);
    if (newPagePath === page.path) {
      setRenameInputShown(false);
      return;
    }

    try {
      setRenameInputShown(false);
      await apiv3Put('/pages/rename', {
        pageId: page._id,
        revisionId: page.revision,
        newPagePath,
      });
      refreshBookmarkList();
      toastSuccess(t('renamed_pages', { path: page.path }));
    }
    catch (err) {
      setRenameInputShown(true);
      toastError(err);
    }
  });

  const deleteMenuItemClickHandler = useCallback(async(_pageId: string, pageInfo: IPageInfoAll | undefined): Promise<void> => {
    const onClickDeleteMenuItem = (pageToDelete: IPageToDeleteWithMeta) => {
      const onDeletedHandler: OnDeletedFunction = (pathOrPathsToDelete, _isRecursively, isCompletely) => {
        if (typeof pathOrPathsToDelete !== 'string') {
          return;
        }
        const path = pathOrPathsToDelete;

        if (isCompletely) {
          toastSuccess(t('deleted_pages_completely', { path }));
        }
        else {
          toastSuccess(t('deleted_pages', { path }));
        }
        refreshBookmarkList();
      };
      openDeleteModal([pageToDelete], { onDeleted: onDeletedHandler });
    };

    if (page._id == null || page.path == null) {
      throw Error('_id and path must not be null.');
    }

    const pageToDelete: IPageToDeleteWithMeta = {
      data: {
        _id: page._id,
        revision: page.revision as string,
        path: page.path,
      },
      meta: pageInfo,
    };

    onClickDeleteMenuItem(pageToDelete);
  }, [page, openDeleteModal, refreshBookmarkList, t]);

  return (
    <>
      <div className="d-flex justify-content-between" key={page._id}>
        <li className="list-group-item list-group-item-action border-0 py-0 pr-3 d-flex align-items-center" id={bookmarkItemId}>
          { isRenameInputShown ? (
            <ClosableTextInput
              value={nodePath.basename(page.path ?? '')}
              placeholder={t('Input page name')}
              onClickOutside={() => { setRenameInputShown(false) }}
              onPressEnter={pressEnterForRenameHandler}
              inputValidator={inputValidator}
            />
          ) : (
            <a href={`/${page._id}`} className="grw-bookmarks-title-anchor flex-grow-1">
              <p className={`text-truncate m-auto ${page.isEmpty && 'grw-sidebar-text-muted'}`}>{pageTitle}</p>
            </a>
          )}
          <PageItemControl
            pageId={page._id}
            isEnableActions
            forceHideMenuItems={[MenuItemType.DUPLICATE]}
            onClickBookmarkMenuItem={bookmarkMenuItemClickHandler}
            onClickRenameMenuItem={renameMenuItemClickHandler}
            onClickDeleteMenuItem={deleteMenuItemClickHandler}
          >
            <DropdownToggle color="transparent" className="border-0 rounded btn-page-item-control p-0 grw-visible-on-hover mr-1">
              <i className="icon-options fa fa-rotate-90 p-1"></i>
            </DropdownToggle>
          </PageItemControl>
          <UncontrolledTooltip
            modifiers={{ preventOverflow: { boundariesElement: 'window' } }}
            autohide={false}
            placement="right"
            target={bookmarkItemId}
          >
            { formerPagePath || '/' }
          </UncontrolledTooltip>
        </li>
      </div>
    </>
  );
};

export default BookmarkItem;
