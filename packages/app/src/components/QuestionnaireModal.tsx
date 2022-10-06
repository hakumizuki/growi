import React, { useState, useCallback } from 'react';

import { useTranslation } from 'next-i18next';
import {
  Modal, ModalBody,
} from 'reactstrap';

import { useSiteUrl, useGrowiVersion } from '~/stores/context';

type ModalProps = {
  isOpen: boolean,
  onClose: () => void,
};

const QuestionnaireCompletionModal = (props: ModalProps): JSX.Element => {
  const { t } = useTranslation();

  const { isOpen, onClose } = props;

  return (
    <Modal
      size="lg"
      isOpen={isOpen}
      toggle={onClose}
      centered
    >
      <ModalBody className="bg-primary overflow-hidden p-0" style={{ borderRadius: 8 }}>
        <div className="bg-white m-2 p-4" style={{ borderRadius: 8 }}>
          <div className="text-center">
            <h2 className="my-4">GROWI サービス改善のためのアンケート</h2>
            <p className="mb-1">アンケートの送信が完了しました。</p>
            <p>アンケートのご回答誠にありがとうございました。</p>
          </div>
          <div className="text-center my-3">
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={onClose}>閉じる</span>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

const QuestionnaireModal = (props: ModalProps): JSX.Element => {
  const { t } = useTranslation();

  const { isOpen, onClose } = props;
  const { data: siteUrl } = useSiteUrl();
  const { data: growiVersion } = useGrowiVersion();

  const [isQuestionnaireCompletionModal, setQuestionnaireCompletionModal] = useState(false);

  const submitHandler = useCallback(async(e) => {
    e.preventDefault();

    const formData = e.target.elements;

    const {
      satisfaction: { value: satisfaction },
      lengthOfExperience: { value: lengthOfExperience },
      position: { value: position },
      occupation: { value: occupation },
      commentText: { value: commentText },
    } = formData;

    const sendValues = {
      satisfaction: Number(satisfaction),
      lengthOfExperience,
      position,
      occupation,
      commentText,
      growiUri: siteUrl,
      growiVersion,
    };

    // TODO: アンケート結果を送信する

    onClose();
    setQuestionnaireCompletionModal(true);
  }, [growiVersion, onClose, siteUrl]);

  return (
    <>
      <Modal
        size="lg"
        isOpen={isOpen}
        toggle={onClose}
        centered
      >
        <ModalBody className="bg-primary overflow-hidden p-0" style={{ borderRadius: 8 }}>
          <div className="bg-white m-2 p-4" style={{ borderRadius: 8 }}>
            <div className="text-center">
              <h2 className="my-4">GROWI サービス改善のためのアンケート</h2>
              <p className="mb-1">GROWI をご利用の皆さまに更にご満足いただけるよう</p>
              <p>皆さまからのご意見を参考にサービス改善に務めてまいります。</p>
            </div>
            <form className="px-5" onSubmit={submitHandler}>
              <div className="form-group row mt-5">
                <label className="col-sm-5 col-form-label" htmlFor="satisfaction"><span className="badge badge-primary mr-2">必須</span>GROWI の満足度</label>
                <select className="col-sm-7 form-control" name="satisfaction" id="satisfaction" required>
                  <option value="">▼ 選択してください</option>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
                </select>
              </div>
              <div className="form-group row mt-3">
                <label className="col-sm-5 col-form-label" htmlFor="lengthOfExperience">GROWI の利用歴</label>
                <select
                  name="lengthOfExperience"
                  id="lengthOfExperience"
                  className="col-sm-7 form-control"
                >
                  <option value="">▼ 選択してください</option>
                  <option>2年以上</option>
                  <option>1年以上2年未満</option>
                  <option>6ヶ月以上1年未満</option>
                  <option>3ヶ月以上6ヶ月未満</option>
                  <option>1ヶ月以上3ヶ月未満</option>
                  <option>1ヶ月未満</option>
                </select>
              </div>
              <div className="form-group row mt-3">
                <label className="col-sm-5 col-form-label" htmlFor="position">職種</label>
                <input className="col-sm-7 form-control" type="text" name="position" id="position" />
              </div>
              <div className="form-group row mt-3">
                <label className="col-sm-5 col-form-label" htmlFor="occupation">役職</label>
                <input className="col-sm-7 form-control" type="text" name="occupation" id="occupation" />
              </div>
              <div className="form-group row mt-3">
                <label className="col-sm-5 col-form-label" htmlFor="commentText">GROWI へのコメント</label>
                <textarea className="col-sm-7 form-control" name="commentText" id="commentText" rows={5} />
              </div>
              <div className="text-center mt-5">
                <button type="submit" className="btn btn-primary">回答する</button>
              </div>
              <div className="text-center my-3">
                <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={onClose}>閉じる</span>
              </div>
            </form>
          </div>
        </ModalBody>
      </Modal>
      <QuestionnaireCompletionModal isOpen={isQuestionnaireCompletionModal} onClose={() => setQuestionnaireCompletionModal(false)} />
    </>
  );
};

export default QuestionnaireModal;
