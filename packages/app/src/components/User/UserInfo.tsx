import React from 'react';

import { UserPicture } from '@growi/ui';

import { usePageUser } from '~/stores/context';

import styles from './UserInfo.module.scss';

export const UserInfo = (): JSX.Element => {

  const { data: pageUser } = usePageUser();

  if (pageUser == null || pageUser.status === 4) {
    return <></>;
  }

  return (
    <div className={`${styles['grw-users-info']} grw-users-info d-flex align-items-center d-edit-none mb-5 pb-3 border-bottom`}>
      <UserPicture user={pageUser} />
      <div className="users-meta">
        <h1 className="user-page-name">
          {pageUser.name}
        </h1>
        <div className="user-page-meta mt-3 mb-0">
          <span className="user-page-username mr-4"><i className="icon-user mr-1"></i>{pageUser.username}</span>
          <span className="user-page-email mr-2">
            <i className="icon-envelope mr-1"></i>
            { pageUser.isEmailPublished
              ? pageUser.email
              : '*****'
            }
          </span>
          { pageUser.introduction && (
            <span className="user-page-introduction">{pageUser.introduction}</span>
          ) }
        </div>
      </div>
    </div>
  );

};