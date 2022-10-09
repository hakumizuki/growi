import React, { useCallback, useState, useEffect } from 'react';

import { useTranslation } from 'next-i18next';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import * as toastr from 'toastr';

import { apiPost } from '~/client/util/apiv1-client';

// import { toastSuccess, toastError } from '~/client/util/apiNotification';


const GROUPS_PAGE = [
  'pages', 'revisions', 'tags', 'pagetagrelations', 'pageredirects', 'comments', 'sharelinks',
];
const GROUPS_USER = [
  'users', 'externalaccounts', 'usergroups', 'usergrouprelations',
  'useruisettings', 'editorsettings', 'bookmarks', 'subscriptions',
  'inappnotificationsettings',
];
const GROUPS_CONFIG = [
  'configs', 'updateposts', 'globalnotificationsettings', 'slackappintegrations',
];
const ALL_GROUPED_COLLECTIONS = GROUPS_PAGE.concat(GROUPS_USER).concat(GROUPS_CONFIG);

type Props = {
  isOpen: boolean,
  onExportingRequested: () => void,
  onClose: () => void,
  collections: string[],
  isAllChecked?: boolean,
};

const SelectCollectionsModal = (props: Props): JSX.Element => {
  const { t } = useTranslation();

  const {
    isOpen, onExportingRequested, onClose, collections, isAllChecked,
  } = props;

  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

  const toggleCheckbox = useCallback((e) => {
    const { target } = e;
    const { name, checked } = target;

    setSelectedCollections((prevState) => {
      const selectedCollections = new Set(prevState);
      if (checked) {
        selectedCollections.add(name);
      }
      else {
        selectedCollections.delete(name);
      }

      return selectedCollections;
    });
  }, []);

  const checkAll = useCallback(() => {
    setSelectedCollections(new Set(collections));
  }, [collections]);

  const uncheckAll = useCallback(() => {
    setSelectedCollections(new Set());
  }, []);

  const doExport = useCallback(async(e) => {
    e.preventDefault();

    try {
      // TODO: use apiv3Post
      const result = await apiPost<any>('/v3/export', { collections: Array.from(selectedCollections) });
      // TODO: toastSuccess, toastError

      if (!result.ok) {
        throw new Error('Error occured.');
      }

      // TODO: toastSuccess, toastError
      toastr.success(undefined, 'Export process has requested.', {
        closeButton: true,
        progressBar: true,
        newestOnTop: false,
        showDuration: '100',
        hideDuration: '100',
        timeOut: '1200',
        extendedTimeOut: '150',
      });

      onExportingRequested();
      onClose();
      uncheckAll();
    }
    catch (err) {
      // TODO: toastSuccess, toastError
      toastr.error(err, 'Error', {
        closeButton: true,
        progressBar: true,
        newestOnTop: false,
        showDuration: '100',
        hideDuration: '100',
        timeOut: '3000',
      });
    }
  }, [onClose, onExportingRequested, selectedCollections, uncheckAll]);

  const validateForm = useCallback(() => {
    return selectedCollections.size > 0;
  }, [selectedCollections.size]);

  const renderWarnForUser = useCallback(() => {
    // whether selectedCollections includes one of GROUPS_USER
    const isUserRelatedDataSelected = GROUPS_USER.some((collectionName) => {
      return selectedCollections.has(collectionName);
    });

    if (!isUserRelatedDataSelected) {
      return <></>;
    }

    const html = t('admin:export_management.desc_password_seed');

    // eslint-disable-next-line react/no-danger
    return <div className="card well" dangerouslySetInnerHTML={{ __html: html }}></div>;
  }, [selectedCollections, t]);

  const renderCheckboxes = useCallback((collectionNames, color?) => {
    const checkboxColor = color ? `custom-checkbox-${color}` : 'custom-checkbox-info';

    return (
      <div className={`custom-control custom-checkbox ${checkboxColor}`}>
        <div className="row">
          {collectionNames.map((collectionName) => {
            return (
              <div className="col-sm-6 my-1" key={collectionName}>
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id={collectionName}
                  name={collectionName}
                  value={collectionName}
                  checked={selectedCollections.has(collectionName)}
                  onChange={toggleCheckbox}
                />
                <label className="text-capitalize custom-control-label ml-3" htmlFor={collectionName}>
                  {collectionName}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [selectedCollections, toggleCheckbox]);

  const renderGroups = useCallback((groupList, color?) => {
    const collectionNames = groupList.filter((collectionName) => {
      return collections.includes(collectionName);
    });

    return renderCheckboxes(collectionNames, color);
  }, [collections, renderCheckboxes]);

  const renderOthers = useCallback(() => {
    const collectionNames = collections.filter((collectionName) => {
      return !ALL_GROUPED_COLLECTIONS.includes(collectionName);
    });

    return renderCheckboxes(collectionNames);
  }, [collections, renderCheckboxes]);

  useEffect(() => {
    if (isAllChecked) checkAll();
  }, [isAllChecked, checkAll]);

  return (
    <Modal isOpen={isOpen} toggle={onClose}>
      <ModalHeader tag="h4" toggle={onClose} className="bg-info text-light">
        {t('admin:export_management.export_collections')}
      </ModalHeader>

      <form onSubmit={doExport}>
        <ModalBody>
          <div className="row">
            <div className="col-sm-12">
              <button type="button" className="btn btn-sm btn-outline-secondary mr-2" onClick={checkAll}>
                <i className="fa fa-check-square-o"></i> {t('admin:export_management.check_all')}
              </button>
              <button type="button" className="btn btn-sm btn-outline-secondary mr-2" onClick={uncheckAll}>
                <i className="fa fa-square-o"></i> {t('admin:export_management.uncheck_all')}
              </button>
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-sm-12">
              <h3 className="admin-setting-header">MongoDB Page Collections</h3>
              {renderGroups(GROUPS_PAGE)}
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-sm-12">
              <h3 className="admin-setting-header">MongoDB User Collections</h3>
              {renderGroups(GROUPS_USER, 'danger')}
              {renderWarnForUser()}
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-sm-12">
              <h3 className="admin-setting-header">MongoDB Config Collections</h3>
              {renderGroups(GROUPS_CONFIG)}
            </div>
          </div>
          <div className="row mt-4">
            <div className="col-sm-12">
              <h3 className="admin-setting-header">MongoDB Other Collections</h3>
              {renderOthers()}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>{t('admin:export_management.cancel')}</button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={!validateForm()}>{t('admin:export_management.export')}</button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default SelectCollectionsModal;
