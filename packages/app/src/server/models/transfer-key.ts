import { Model, Schema, HydratedDocument } from 'mongoose';

import { ITransferKey } from '~/interfaces/transfer-key';

import loggerFactory from '../../utils/logger';
import { getOrCreateModel } from '../util/mongoose-utils';

const logger = loggerFactory('growi:models:transfer-key');

interface ITransferKeyMethods {
  findOneActiveTransferKey(key: string): Promise<HydratedDocument<ITransferKey, ITransferKeyMethods> | null>;
}

type TransferKeyModel = Model<ITransferKey, any, ITransferKeyMethods>;

const schema = new Schema<ITransferKey, TransferKeyModel, ITransferKeyMethods>({
  expireAt: { type: Date, default: () => new Date(), expires: '30m' },
  keyString: { type: String, unique: true }, // original key string
  key: { type: String, unique: true },
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
});

// TODO: validate createdAt
schema.statics.findOneActiveTransferKey = async function(key: string): Promise<HydratedDocument<ITransferKey, ITransferKeyMethods> | null> {
  return this.findOne({ key });
};

export default getOrCreateModel('TransferKey', schema);
