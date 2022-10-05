import path from 'path';

import express, { NextFunction, Request, Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';

import { SupportedAction } from '~/interfaces/activity';
import GrowiArchiveImportOption from '~/models/admin/growi-archive-import-option';
import TransferKeyModel from '~/server/models/transfer-key';
import { isG2GTransferError } from '~/server/models/vo/g2g-transfer-error';
import { IDataGROWIInfo, X_GROWI_TRANSFER_KEY_HEADER_NAME } from '~/server/service/g2g-transfer';
import loggerFactory from '~/utils/logger';
import { TransferKey } from '~/utils/vo/transfer-key';


import Crowi from '../../crowi';
import { apiV3FormValidator } from '../../middlewares/apiv3-form-validator';
import ErrorV3 from '../../models/vo/error-apiv3';

import { generateOverwriteParams } from './import';
import { ApiV3Response } from './interfaces/apiv3-response';

const logger = loggerFactory('growi:routes:apiv3:transfer');

const validator = {
  transfer: [
    body('transferKey').isString().withMessage('transferKey is required'),
    body('collections').isArray().withMessage('collections is required'),
  ],
};

/*
 * Routes
 */
module.exports = (crowi: Crowi): Router => {
  const {
    g2gTransferPusherService, g2gTransferReceiverService, exportService, importService,
    growiBridgeService,
  } = crowi;
  if (g2gTransferPusherService == null || g2gTransferReceiverService == null || exportService == null || importService == null
    || growiBridgeService == null) {
    throw Error('GROWI is not ready for g2g transfer');
  }

  const uploads = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, importService.baseDir);
      },
      filename(req, file, cb) {
        // to prevent hashing the file name. files with same name will be overwritten.
        cb(null, file.originalname);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (path.extname(file.originalname) === '.zip') {
        return cb(null, true);
      }
      cb(new Error('Only ".zip" is allowed'));
    },
  });

  const isInstalled = crowi.configManager?.getConfig('crowi', 'app:installed');

  const accessTokenParser = require('../../middlewares/access-token-parser')(crowi);
  const adminRequired = require('../../middlewares/admin-required')(crowi);
  const loginRequiredStrictly = require('../../middlewares/login-required')(crowi);

  // Middleware
  const adminRequiredIfInstalled = (req: Request, res: ApiV3Response, next: NextFunction) => {
    if (!isInstalled) {
      next();
      return;
    }

    return adminRequired(req, res, next);
  };

  // Middleware
  const appSiteUrlRequiredIfNotInstalled = (req: Request, res: ApiV3Response, next: NextFunction) => {
    if (!isInstalled && req.body.appSiteUrl != null) {
      next();
      return;
    }

    if (crowi.configManager?.getConfig('crowi', 'app:siteUrl') != null || req.body.appSiteUrl != null) {
      next();
      return;
    }

    return res.apiv3Err(new ErrorV3('Body param "appSiteUrl" is required when GROWI is NOT installed yet'), 400);
  };

  // Local middleware to check if key is valid or not
  const verifyAndExtractTransferKey = async(req: Request & { transferKey: TransferKey }, res: ApiV3Response, next: NextFunction) => {
    const transferKeyString = req.headers[X_GROWI_TRANSFER_KEY_HEADER_NAME];

    if (typeof transferKeyString !== 'string') {
      return res.apiv3Err(new ErrorV3('Invalid transfer key or not set.', 'invalid_transfer_key'), 400);
    }

    let transferKey;
    try {
      transferKey = await (TransferKeyModel as any).findOneActiveTransferKey(transferKeyString); // TODO: Improve TS of models
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Error occurred while trying to fing a transfer key.', 'failed_to_find_transfer_key'), 500);
    }

    if (transferKey == null) {
      return res.apiv3Err(new ErrorV3('Transfer key has expired or not found.', 'transfer_key_expired_or_not_found'), 404);
    }

    // Inject transferKey to req
    try {
      req.transferKey = TransferKey.parse(transferKey.value);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Transfer key is invalid.', 'invalid_transfer_key'), 500);
    }

    next();
  };

  const router = express.Router();
  const receiveRouter = express.Router();
  const pushRouter = express.Router();

  // Auto import
  receiveRouter.post('/', uploads.single('file'), verifyAndExtractTransferKey, async(req: Request & { transferKey: TransferKey }, res: ApiV3Response) => {
    const { file } = req;

    const zipFile = importService.getFile(file.filename);
    let data;

    // ぶちこみ

    const { collections, optionsMap } = req.body;

    /*
     * unzip, parse
     */
    let meta;
    let innerFileStats;
    try {
      // unzip
      await importService.unzip(zipFile);

      // eslint-disable-next-line no-unused-vars
      const { meta: parsedMeta, innerFileStats: _innerFileStats } = await growiBridgeService.parseZipFile(zipFile);
      innerFileStats = _innerFileStats;
      meta = parsedMeta;
    }
    catch (err) {
      logger.error(err);
      // adminEvent.emit('onErrorForImport', { message: err.message });
      return;
    }

    /*
     * validate with meta.json
     */
    try {
      importService.validate(meta);
    }
    catch (err) {
      logger.error(err);
      // adminEvent.emit('onErrorForImport', { message: err.message });
      return;
    }

    // generate maps of ImportSettings to import
    const importSettingsMap = {};
    innerFileStats.forEach(({ fileName, collectionName }) => {
      // instanciate GrowiArchiveImportOption
      const options = new GrowiArchiveImportOption(null, optionsMap[collectionName]);

      let importSettings;
      // generate options
      if (collectionName === 'configs') {
        importSettings = importService.generateImportSettings('flushAndInsert');
      }
      else {
        importSettings = importService.generateImportSettings('upsert');
      }
      importSettings.jsonFileName = fileName;

      // generate overwrite params
      importSettings.overwriteParams = generateOverwriteParams(collectionName, req, options);

      importSettingsMap[collectionName] = importSettings;
    });

    /*
     * import
     */
    try {
      importService.import(collections, importSettingsMap);
      const parameters = { action: SupportedAction.ACTION_ADMIN_GROWI_DATA_IMPORTED };
      // activityEvent.emit('update', res.locals.activity._id, parameters);
    }
    catch (err) {
      logger.error(err);
      // adminEvent.emit('onErrorForImport', { message: err.message });
    }

    // ここまで

    try {
      data = await growiBridgeService.parseZipFile(zipFile);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Failed to validate transfer data file.', 'validation_failed'), 500);
    }

    try {
      // validate with meta.json
      importService.validate(data.meta);

      // const parameters = { action: SupportedAction.ACTION_ADMIN_ARCHIVE_DATA_UPLOAD };
      // activityEvent.emit('update', res.locals.activity._id, parameters);
    }
    catch {
      const msg = 'the version of this growi and the growi that exported the data are not met';
      const varidationErr = 'versions-are-not-met';
      return res.apiv3Err(new ErrorV3(msg, varidationErr), 500);
    }

    try {
      await g2gTransferReceiverService.receive(file.stream);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Error occurred while importing transfer data.', 'failed_to_receive'));
    }

    return res.apiv3({ message: 'Successfully started to receive transfer data.' });
  });

  receiveRouter.get('/growi-info', verifyAndExtractTransferKey, async(req: Request & { transferKey: TransferKey }, res: ApiV3Response) => {
    let growiInfo: IDataGROWIInfo;
    try {
      growiInfo = await g2gTransferReceiverService.answerGROWIInfo();
    }
    catch (err) {
      logger.error(err);

      if (!isG2GTransferError(err)) {
        return res.apiv3Err(new ErrorV3('Failed to prepare growi info', 'failed_to_prepare_growi_info'), 500);
      }

      return res.apiv3Err(new ErrorV3(err.message, err.code), 500);
    }

    return res.apiv3({ growiInfo });
  });

  // eslint-disable-next-line max-len
  receiveRouter.post('/generate-key', accessTokenParser, adminRequiredIfInstalled, appSiteUrlRequiredIfNotInstalled, async(req: Request, res: ApiV3Response) => {
    const strAppSiteUrl = req.body.appSiteUrl ?? crowi.configManager?.getConfig('crowi', 'app:siteUrl');

    // Generate transfer key string
    let appSiteUrl: URL;
    try {
      appSiteUrl = new URL(strAppSiteUrl);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('appSiteUrl may be wrong', 'failed_to_generate_key_string'));
    }

    // Save TransferKey document
    let transferKeyString: string;
    try {
      transferKeyString = await g2gTransferReceiverService.createTransferKey(appSiteUrl);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Error occurred while generating transfer key.', 'failed_to_generate_key'));
    }

    return res.apiv3({ transferKey: transferKeyString });
  });

  // Auto export
  // TODO: Use socket to send progress info to the client
  // eslint-disable-next-line max-len
  pushRouter.post('/transfer', accessTokenParser, loginRequiredStrictly, adminRequired, validator.transfer, apiV3FormValidator, async(req: Request, res: ApiV3Response) => {
    const { transferKey: transferKeyString, collections, optionsMap } = req.body;

    // Parse transfer key
    let tk: TransferKey;
    try {
      tk = TransferKey.parse(transferKeyString);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('Transfer key is invalid', 'transfer_key_invalid'), 400);
    }

    // Ask growi info
    // TODO: Ask progress as well
    let fromGROWIInfo: IDataGROWIInfo;
    try {
      fromGROWIInfo = await g2gTransferPusherService.askGROWIInfo(tk);
    }
    catch (err) {
      logger.error(err);
      return res.apiv3Err(new ErrorV3('GROWI is incompatible to transfer data.', 'growi_incompatible_to_transfer'));
    }

    // Check if can transfer
    const canTransfer = await g2gTransferPusherService.canTransfer(fromGROWIInfo);
    if (!canTransfer) {
      logger.debug('Could not transfer.');
      return res.apiv3Err(new ErrorV3('GROWI is incompatible to transfer data.', 'growi_incompatible_to_transfer'));
    }

    // Start transfer
    try {
      await g2gTransferPusherService.startTransfer(tk, collections, optionsMap);
    }
    catch (err) {
      logger.error(err);

      if (!isG2GTransferError(err)) {
        return res.apiv3Err(new ErrorV3('Failed to transfer', 'failed_to_transfer'), 500);
      }

      return res.apiv3Err(new ErrorV3(err.message, err.code), 500);
    }

    return res.apiv3({ message: 'Successfully requested auto transfer.' });
  });

  // Merge receiveRouter and pushRouter
  router.use(receiveRouter, pushRouter);

  return router;
};