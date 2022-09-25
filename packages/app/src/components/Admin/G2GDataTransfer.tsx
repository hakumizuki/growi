import React, { useCallback, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';
import * as toastr from 'toastr';

import AdminSocketIoContainer from '~/client/services/AdminSocketIoContainer';
import { apiv3Get } from '~/client/util/apiv3-client';

import CustomCopyToClipBoard from '../Common/CustomCopyToClipBoard';
import { withUnstatedContainers } from '../UnstatedUtils';

import SelectCollectionsModal from './ExportArchiveData/SelectCollectionsModal';

const IGNORED_COLLECTION_NAMES = [
  'sessions', 'rlflx', 'activities',
];

type Props = {
  adminSocketIoContainer: AdminSocketIoContainer,
};

const G2GDataTransfer = (props: Props): JSX.Element => {
  const { t } = useTranslation();

  const { adminSocketIoContainer } = props;

  const [collections, setCollections] = useState<any[]>([]);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isExporting, setExporting] = useState(false);
  // TODO: データのエクスポートが完了したことが分かるようにする
  const [isExported, setExported] = useState(false);
  const [transferKey, setTransferKey] = useState('');

  const fetchData = useCallback(async() => {
    const [{ data: collectionsData }, { data: statusData }] = await Promise.all([
      apiv3Get<{collections: any[]}>('/mongo/collections', {}),
      apiv3Get<{status: { zipFileStats: any[], isExporting: boolean, progressList: any[] }}>('/export/status', {}),
    ]);

    // filter only not ignored collection names
    const filteredCollections = collectionsData.collections.filter((collectionName) => {
      return !IGNORED_COLLECTION_NAMES.includes(collectionName);
    });

    setCollections(filteredCollections);
    setExporting(statusData.status.isExporting);
  }, []);

  const setupWebsocketEventHandler = useCallback(() => {
    const socket = adminSocketIoContainer.getSocket();

    // websocket event
    socket.on('admin:onProgressForExport', ({ currentCount, totalCount, progressList }) => {
      setExporting(true);
    });

    // websocket event
    socket.on('admin:onTerminateForExport', ({ addedZipFileStat }) => {
      setExporting(false);
      setExported(true);

      // TODO: toastSuccess, toastError
      toastr.success(undefined, `New Archive Data '${addedZipFileStat.fileName}' is added`, {
        closeButton: true,
        progressBar: true,
        newestOnTop: false,
        showDuration: '100',
        hideDuration: '100',
        timeOut: '1200',
        extendedTimeOut: '150',
      });
    });
  }, [adminSocketIoContainer]);

  const publishTransferKey = () => {
    // 移行キー発行の処理
    setTransferKey('transferKey');
  };

  const transferData = () => {
    // データ移行の処理
  };

  const exportingRequestedHandler = useCallback(() => {}, []);

  useEffect(() => {
    fetchData();

    setupWebsocketEventHandler();
  }, [fetchData, setupWebsocketEventHandler]);

  return (
    <div data-testid="admin-export-archive-data">
      <h2 className="border-bottom">{t('admin:g2g_data_transfer.transfer_data_to_another_growi')}</h2>

      <button type="button" className="btn btn-outline-secondary mt-4" disabled={isExporting} onClick={() => setExportModalOpen(true)}>
        {t('admin:g2g_data_transfer.advanced_options')}
      </button>

      <form onSubmit={transferData}>
        <div className="form-group row mt-3">
          <div className="col-9">
            <input className="form-control" type="text" placeholder={t('admin:g2g_data_transfer.paste_transfer_key')} />
          </div>
          <div className="col-3">
            <button type="submit" className="btn btn-primary w-100">{t('admin:g2g_data_transfer.start_transfer')}</button>
          </div>
        </div>
      </form>

      <h2 className="border-bottom mt-5">{t('admin:g2g_data_transfer.transfer_data_to_this_growi')}</h2>

      <div className="form-group row mt-4">
        <div className="col-md-3">
          <button type="button" className="btn btn-primary w-100" onClick={publishTransferKey}>{t('admin:g2g_data_transfer.publish_transfer_key')}</button>
        </div>
        <div className="col-md-9">
          <div className="input-group-prepend mx-1">
            <input className="form-control" type="text" value={transferKey} readOnly />
            <CustomCopyToClipBoard textToBeCopied={transferKey} message="admin:slack_integration.copied_to_clipboard" />
          </div>
        </div>
      </div>

      <p className="mt-4 mb-1">{t('admin:g2g_data_transfer.transfer_key_limit')}</p>
      <p className="mb-1">{t('admin:g2g_data_transfer.once_transfer_key_used')}</p>
      <p className="mb-1">{t('admin:g2g_data_transfer.transfer_to_growi_cloud')}</p>

      <SelectCollectionsModal
        isOpen={isExportModalOpen}
        onExportingRequested={exportingRequestedHandler}
        onClose={() => setExportModalOpen(false)}
        collections={collections}
      />
    </div>
  );
};

/**
 * Wrapper component for using unstated
 */
const G2GDataTransferWrapper = withUnstatedContainers(G2GDataTransfer, [AdminSocketIoContainer]);

export default G2GDataTransferWrapper;
