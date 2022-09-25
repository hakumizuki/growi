import { Readable } from 'stream';

/**
 * Data used for comparing to/from GROWI information
 */
export type IDataFromGROWIInfo = {
  version: string
  userLimit: number
}

interface Pusher {
  /**
   * Start transfer data between GROWIs
   * @param {string} key Transfer key
   */
  startTransfer(key: string): Promise<Readable>
}

interface Receiver {
  /**
   * Check if key is not expired
   * @param {string} key Transfer key
   */
  validateTransferKey(key: string): Promise<boolean>
  /**
   * Check if transfering is proceedable
   * @param {IDataFromGROWIInfo} fromGROWIInfo
   */
  canTransfer(fromGROWIInfo: IDataFromGROWIInfo): Promise<boolean>
}

export class AutoTransferService implements Pusher, Receiver {

  public async startTransfer(key: string): Promise<Readable> { return new Readable() }

  public async validateTransferKey(key: string): Promise<boolean> { return true }

  public async canTransfer(fromGROWIInfo: IDataFromGROWIInfo): Promise<boolean> { return true }

  private onCompleteTransfer(): void { return }

}
