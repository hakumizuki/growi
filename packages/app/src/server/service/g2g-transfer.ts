import { createReadStream, ReadStream } from 'fs';
import { Readable } from 'stream';

// eslint-disable-next-line no-restricted-imports
import rawAxios from 'axios';
import FormData from 'form-data';
import { Types as MongooseTypes } from 'mongoose';

import TransferKeyModel from '~/server/models/transfer-key';
import axios from '~/utils/axios';
import loggerFactory from '~/utils/logger';
import { TransferKey } from '~/utils/vo/transfer-key';

import { G2GTransferError, G2GTransferErrorCode } from '../models/vo/g2g-transfer-error';

const logger = loggerFactory('growi:service:g2g-transfer');

export const X_GROWI_TRANSFER_KEY_HEADER_NAME = 'x-growi-transfer-key';

/**
 * Data used for comparing to/from GROWI information
 */
export type IDataGROWIInfo = {
  version: string
  userUpperLimit: number | null // Handle null as Infinity
  attachmentInfo: any
}

interface Pusher {
  /**
   * Send to-growi a request to get growi info
   * @param {TransferKey} tk Transfer key
   */
  askGROWIInfo(tk: TransferKey): Promise<IDataGROWIInfo>
  /**
   * Check if transfering is proceedable
   * @param {IDataGROWIInfo} fromGROWIInfo
   */
  canTransfer(fromGROWIInfo: IDataGROWIInfo): Promise<boolean>
  /**
   * @param {TransferKey} tk Transfer key object
   */
  transferAttachments(tk: TransferKey): Promise<void>
  /**
   * Start transfer data between GROWIs
   * @param {TransferKey} tk TransferKey object
   * @param {string[]} collections Collection name string array
   * @param {any} optionsMap Options map
   */
  startTransfer(tk: TransferKey, user: any, collections: string[], optionsMap: any): Promise<void>
}

interface Receiver {
  /**
   * Check if key is not expired
   * @throws {import('../models/vo/g2g-transfer-error').G2GTransferError}
   * @param {string} key Transfer key
   */
  validateTransferKey(key: string): Promise<void>
  /**
   * Check if key is not expired
   * @throws {import('../models/vo/g2g-transfer-error').G2GTransferError}
   */
  answerGROWIInfo(): Promise<IDataGROWIInfo>
  /**
   * DO NOT USE TransferKeyModel.create() directly, instead, use this method to create a TransferKey document.
   * This method receives appSiteUrl to create a TransferKey document and returns generated transfer key string.
   * UUID is the same value as the created document's _id.
   * @param {URL} appSiteUrl URL type appSiteUrl
   * @returns {string} Transfer key string (e.g. http://localhost:3000__grw_internal_tranferkey__<uuid>)
   */
  createTransferKey(appSiteUrl: URL): Promise<string>
  /**
   * Receive transfer request and import data.
   * @param {Readable} zippedGROWIDataStream
   * @returns {void}
   */
  receive(zippedGROWIDataStream: Readable): Promise<void>
}

export class G2GTransferPusherService implements Pusher {

  crowi: any;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(crowi: any) {
    this.crowi = crowi;
  }

  public async askGROWIInfo(tk: TransferKey): Promise<IDataGROWIInfo> {
    // axios get
    let toGROWIInfo: IDataGROWIInfo;
    try {
      const res = await axios.get('/_api/v3/g2g-transfer/growi-info', this.generateAxiosRequestConfig(tk));
      toGROWIInfo = res.data.growiInfo;
    }
    catch (err) {
      logger.error(err);
      throw new G2GTransferError('Failed to retreive growi info.', G2GTransferErrorCode.FAILED_TO_RETREIVE_GROWI_INFO);
    }

    return toGROWIInfo;
  }

  public async canTransfer(toGROWIInfo: IDataGROWIInfo): Promise<boolean> {
    const configManager = this.crowi.configManager;
    const userUpperLimit = configManager.getConfig('crowi', 'security:userUpperLimit');
    const version = this.crowi.version;

    if (version !== toGROWIInfo.version) {
      return false;
    }

    if ((userUpperLimit ?? Infinity) < (toGROWIInfo.userUpperLimit ?? 0)) {
      return false;
    }

    return true;
  }

  public async transferAttachments(tk: TransferKey): Promise<void> {
    const { appUrl, key } = tk;
    const { fileUploadService } = this.crowi;
    const Attachment = this.crowi.model('Attachment');

    // TODO: batch get
    const attachments = await Attachment.find();
    for await (const attachment of attachments) {
      logger.debug(`processing attachment: ${attachment}`);
      let fileStream;
      try {
        // get read stream of each attachment
        fileStream = await fileUploadService.findDeliveryFile(attachment);
      }
      catch (err) {
        logger.warn(`Error occured when getting Attachment(ID=${attachment.id}), skipping: `, err);
        continue;
      }
      // TODO: get attachmentLists from destination GROWI to avoid transferring files that the dest GROWI has
      // TODO: refresh transfer key per 1 hour
      // post each attachment file data to receiver
      try {
        // Use FormData to immitate browser's form data object
        const form = new FormData();

        form.append('content', fileStream, attachment.fileName);
        form.append('attachmentMetadata', JSON.stringify(attachment));
        await rawAxios.post('/_api/v3/g2g-transfer/attachment', form, {
          baseURL: appUrl.origin,
          headers: {
            ...form.getHeaders(), // This generates a unique boundary for multi part form data
            [X_GROWI_TRANSFER_KEY_HEADER_NAME]: key,
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
      }
      catch (errs) {
        logger.error(`Error occured when uploading attachment(ID=${attachment.id})`, errs);
        if (!Array.isArray(errs)) {
          // TODO: socker.emit(failed_to_transfer);
          return;
        }

        const err = errs[0];
        logger.error(err);


        // TODO: socker.emit(failed_to_transfer);
        return;
      }
    }
  }

  public async startTransfer(tk: TransferKey, user: any, collections: string[], optionsMap: any): Promise<void> {
    const { appUrl, key } = tk;

    let zipFileStream: ReadStream;
    try {
      const shouldEmit = false;
      const zipFileStat = await this.crowi.exportService.export(collections, shouldEmit);
      const zipFilePath = zipFileStat.zipFilePath;

      zipFileStream = createReadStream(zipFilePath);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    // Send a zip file to other growi via axios
    try {
      // Use FormData to immitate browser's form data object
      const form = new FormData();

      const appTitle = this.crowi.appService.getAppTitle();
      form.append('transferDataZipFile', zipFileStream, `${appTitle}-${Date.now}.growi.zip`);
      form.append('collections', JSON.stringify(collections));
      form.append('optionsMap', JSON.stringify(optionsMap));
      form.append('operatorUserId', user._id.toString());
      await rawAxios.post('/_api/v3/g2g-transfer/', form, {
        baseURL: appUrl.origin,
        headers: {
          ...form.getHeaders(), // This generates a unique boundary for multi part form data
          [X_GROWI_TRANSFER_KEY_HEADER_NAME]: key,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
    }
    catch (errs) {
      logger.error(errs);
      if (!Array.isArray(errs)) {
        // TODO: socker.emit(failed_to_transfer);
        return;
      }

      const err = errs[0];
      logger.error(err);


      // TODO: socker.emit(failed_to_transfer);
      return;
    }
  }

  private generateAxiosRequestConfig(tk: TransferKey) {
    const { appUrl, key } = tk;

    return {
      baseURL: appUrl.origin,
      headers: {
        [X_GROWI_TRANSFER_KEY_HEADER_NAME]: key,
      },
    };
  }

}

export class G2GTransferReceiverService implements Receiver {

  crowi: any;

  constructor(crowi: any) {
    this.crowi = crowi;
  }

  public async validateTransferKey(transferKeyString: string): Promise<void> {
    // Parse to tk
    // Find active tkd

    return;
  }

  public async answerGROWIInfo(): Promise<IDataGROWIInfo> {
    // TODO: add attachment file limit, storage total limit
    const { configManager } = this.crowi;
    const userUpperLimit = configManager.getConfig('crowi', 'security:userUpperLimit');
    const version = this.crowi.version;
    const attachmentInfo = {
      type: configManager.getConfig('crowi', 'app:fileUploadType'),
      bucket: undefined,
      customEndpoint: undefined, // for S3
      uploadNamespace: undefined, // for GCS
    };

    // put storage location info to check storage identification
    switch (attachmentInfo.type) {
      case 'aws':
        attachmentInfo.bucket = configManager.getConfig('crowi', 'aws:s3Bucket');
        attachmentInfo.customEndpoint = configManager.getConfig('crowi', 'aws:s3CustomEndpoint');
        break;
      case 'gcs':
        attachmentInfo.bucket = configManager.getConfig('crowi', 'gcs:bucket');
        attachmentInfo.uploadNamespace = configManager.getConfig('crowi', 'gcs:uploadNamespace');
        break;
      default:
    }

    return { userUpperLimit, version, attachmentInfo };
  }

  public async createTransferKey(appSiteUrl: URL): Promise<string> {
    const uuid = new MongooseTypes.ObjectId().toString();

    // Generate transfer key string
    let transferKeyString: string;
    try {
      transferKeyString = TransferKey.generateKeyString(uuid, appSiteUrl);
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    // Save TransferKey document
    let tkd;
    try {
      tkd = await TransferKeyModel.create({ _id: uuid, keyString: transferKeyString, key: uuid });
    }
    catch (err) {
      logger.error(err);
      throw err;
    }

    return tkd.keyString;
  }

  public async receive(zipfile: Readable): Promise<void> {
    // Import data
    // Call onCompleteTransfer when finished

    return;
  }

  /**
   *
   * @param content Pushed attachment data from source GROWI
   * @param attachmentMap Map-ped Attachment instance
   * @returns
   */
  public async receiveAttachment(content: Readable, attachmentMap): Promise<void> {
    const { fileUploadService } = this.crowi;
    return fileUploadService.uploadFile(content, attachmentMap);
  }

  /**
   * Sync DB, etc.
   * @returns {Promise<void>}
   */
  private async onCompleteTransfer(): Promise<void> { return }

}
