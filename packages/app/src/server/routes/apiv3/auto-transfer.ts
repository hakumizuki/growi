import express, { NextFunction, Request, Router } from 'express';
import { body } from 'express-validator';

import loggerFactory from '~/utils/logger';

import Crowi from '../../crowi';
import { apiV3FormValidator } from '../../middlewares/apiv3-form-validator';
import ErrorV3 from '../../models/vo/error-apiv3';

import { ApiV3Response } from './interfaces/apiv3-response';

const logger = loggerFactory('growi:routes:apiv3:auto-transfer');

const validator = {
  transfer: [
    body('transferKey').isString().withMessage('transferKey is required'),
  ],
};

// Middleware to check if key is valid or not
const validateTransferKey = async(req: Request, res: ApiV3Response, next: NextFunction) => {
  const { transferKey } = req.body;
  // TODO: Check key
  next();
};

/*
 * Routes
 */
export default (crowi: Crowi): Router => {
  const accessTokenParser = require('../../middlewares/access-token-parser')(crowi);
  const adminRequired = require('../../middlewares/admin-required')(crowi);
  const loginRequiredStrictly = require('../../middlewares/login-required')(crowi);

  const router = express.Router();

  router.post('/', validator.transfer, apiV3FormValidator, validateTransferKey, async(req: Request, res: ApiV3Response) => {
    return;
  });

  // eslint-disable-next-line max-len
  router.post('/transfer', accessTokenParser, loginRequiredStrictly, adminRequired, validator.transfer, apiV3FormValidator, async(req: Request, res: ApiV3Response) => {
    return;
  });

  return router;
};
