import React, {
  FC, useCallback, useEffect, useState,
} from 'react';

import canvasToBlob from 'async-canvas-to-blob';
import { useTranslation } from 'react-i18next';
import ReactCrop from 'react-image-crop';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from 'reactstrap';

import { toastError } from '~/client/util/apiNotification';
import loggerFactory from '~/utils/logger';
import 'react-image-crop/dist/ReactCrop.css';

const logger = loggerFactory('growi:ImageCropModal');

interface ICropOptions {
  aspect: number
  unit: string,
  x: number
  y: number
  width: number,
  height: number,
}

type CropOptions = ICropOptions | null

type Props = {
  isShow: boolean,
  src: string | ArrayBuffer | null,
  onModalClose: () => void,
  onCropCompleted: (res: any) => void,
  isCircular: boolean,
  isProfilePicture: boolean
}

const ImageCropModal: FC<Props> = (props: Props) => {

  const {
    isShow, src, onModalClose, onCropCompleted, isCircular, isProfilePicture,
  } = props;

  const [imageRef, setImageRef] = useState<HTMLImageElement>();
  const [cropOptions, setCropOtions] = useState<CropOptions>(null);
  const [isCropImage, setIsCropImage] = useState<boolean>(true);
  const { t } = useTranslation();
  const reset = useCallback(() => {
    if (imageRef) {
      const size = Math.min(imageRef.width, imageRef.height);
      setCropOtions({
        aspect: 1,
        unit: 'px',
        x: imageRef.width / 2 - size / 2,
        y: imageRef.height / 2 - size / 2,
        width: size,
        height: size,
      });
    }
  }, [imageRef]);

  useEffect(() => {
    document.body.style.position = 'static';
    reset();
  }, [reset]);


  const onImageLoaded = (image) => {
    setImageRef(image);
    reset();
    return false;
  };


  const onCropChange = (crop) => {
    setCropOtions(crop);
  };

  const getCroppedImg = async(image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
    try {
      const blob = await canvasToBlob(canvas);
      return blob;
    }
    catch (err) {
      logger.error(err);
      toastError(new Error('Failed to draw image'));
    }
  };

  // Convert base64 Image to blob
  const convertBase64ToBlob = async(base64Image: string) => {
    const parts = base64Image.split(';base64,');
    const imageType = parts[0].split(':')[1];
    const decodedData = window.atob(parts[1]);
    const uInt8Array = new Uint8Array(decodedData.length);
    for (let i = 0; i < decodedData.length; ++i) {
      uInt8Array[i] = decodedData.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: imageType });
  };

  const crop = async() => {
    // crop immages
    if (imageRef && cropOptions?.width && cropOptions.height) {
      const result = isCropImage ? await getCroppedImg(imageRef, cropOptions) : await convertBase64ToBlob(imageRef.src);
      onCropCompleted(result);
    }
  };


  return (
    <Modal isOpen={isShow} toggle={onModalClose}>
      <ModalHeader tag="h4" toggle={onModalClose} className="bg-info text-light">
        {t('crop_image_modal.image_crop')}
      </ModalHeader>
      <ModalBody className="my-4">
        {
          isCropImage
            ? (<ReactCrop src={src} crop={cropOptions} onImageLoaded={onImageLoaded} onChange={onCropChange} circularCrop={isCircular} />)
            : (<img style={{ maxWidth: 450 }} src={imageRef?.src} />)
        }
      </ModalBody>
      <ModalFooter>
        <button type="button" className="btn btn-outline-danger rounded-pill" onClick={reset}>
          {t('crop_image_modal.reset')}
        </button>
        <div className="mr-auto">
          <div className="custom-control custom-switch ">
            <input
              id="cropImageOption"
              className="custom-control-input mr-auto"
              type="checkbox"
              checked={isCropImage}
              onChange={() => { setIsCropImage(!isCropImage) }}
              disabled={isProfilePicture}
            />
            <label className="custom-control-label" htmlFor="cropImageOption">
              { t('Crop Image') }
            </label>
          </div>
        </div>
        <button type="button" className="btn btn-outline-secondary rounded-pill mr-2" onClick={onModalClose}>
          {t('crop_image_modal.cancel')}
        </button>
        <button type="button" className="btn btn-outline-primary rounded-pill" onClick={crop}>
          {t('crop_image_modal.crop')}
        </button>
      </ModalFooter>
      {isCropImage ? (
        <ModalFooter className="border-0 pt-0">
          <p className="text-warning mr-auto">
            {t('Image will saved as PNG')}
          </p>
        </ModalFooter>
      ) : <></>}
    </Modal>
  );
};

export default ImageCropModal;
