import React from 'react';

import { useTranslation } from 'next-i18next';
import PropTypes from 'prop-types';

import AdminMarkDownContainer from '~/client/services/AdminMarkDownContainer';
import { toastSuccess, toastError } from '~/client/util/apiNotification';
import loggerFactory from '~/utils/logger';

import { withUnstatedContainers } from '../../UnstatedUtils';
import AdminUpdateButtonRow from '../Common/AdminUpdateButtonRow';

const logger = loggerFactory('growi:markdown:presentation');

class PresentationForm extends React.Component {

  constructor(props) {
    super(props);

    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  async onClickSubmit() {
    const { t } = this.props;

    try {
      await this.props.adminMarkDownContainer.updatePresentationSetting();
      toastSuccess(t('toaster.update_successed', { target: t('markdown_settings.presentation_header') }));
    }
    catch (err) {
      toastError(err);
      logger.error(err);
    }
  }


  render() {
    const { t, adminMarkDownContainer } = this.props;
    const { pageBreakSeparator, pageBreakCustomSeparator } = adminMarkDownContainer.state;

    return (
      <fieldset className="form-group col-12 my-2">

        <label className="col-8 offset-4 col-form-label font-weight-bold text-left mt-3">
          {t('markdown_settings.presentation_options.page_break_setting')}
        </label>

        <div className="form-group col-12 my-3">
          <div className="row">
            <div className="col-md-4 col-sm-12 align-self-start mb-4">
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  id="pageBreakOption1"
                  checked={pageBreakSeparator === 1}
                  onChange={() => adminMarkDownContainer.switchPageBreakSeparator(1)}
                />
                <label className="custom-control-label w-100" htmlFor="pageBreakOption1">
                  <p className="font-weight-bold">{ t('markdown_settings.presentation_options.preset_one_separator') }</p>
                  <div className="mt-3">
                    { t('markdown_settings.presentation_options.preset_one_separator_desc') }
                    <input
                      className="form-control"
                      type="text"
                      value={t('markdown_settings.presentation_options.preset_one_separator_value')}
                      readOnly
                    />
                  </div>
                </label>
              </div>
            </div>

            <div className="col-md-4 col-sm-12 align-self-start mb-4">
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  id="pageBreakOption2"
                  checked={pageBreakSeparator === 2}
                  onChange={() => adminMarkDownContainer.switchPageBreakSeparator(2)}
                />
                <label className="custom-control-label w-100" htmlFor="pageBreakOption2">
                  <p className="font-weight-bold">{ t('markdown_settings.presentation_options.preset_two_separator') }</p>
                  <div className="mt-3">
                    { t('markdown_settings.presentation_options.preset_two_separator_desc') }
                    <input
                      className="form-control"
                      type="text"
                      value={t('markdown_settings.presentation_options.preset_two_separator_value')}
                      readOnly
                    />
                  </div>
                </label>
              </div>
            </div>
            <div className="col-md-4 col-sm-12 align-self-start mb-4">
              <div className="custom-control custom-radio">
                <input
                  type="radio"
                  id="pageBreakOption3"
                  className="custom-control-input"
                  checked={pageBreakSeparator === 3}
                  onChange={() => adminMarkDownContainer.switchPageBreakSeparator(3)}
                />
                <label className="custom-control-label w-100" htmlFor="pageBreakOption3">
                  <p className="font-weight-bold">{ t('markdown_settings.presentation_options.custom_separator') }</p>
                  <div className="mt-3">
                    { t('markdown_settings.presentation_options.custom_separator_desc') }
                    <input
                      className="form-control"
                      defaultValue={pageBreakCustomSeparator}
                      onChange={(e) => { adminMarkDownContainer.setPageBreakCustomSeparator(e.target.value) }}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <AdminUpdateButtonRow onClick={this.onClickSubmit} disabled={adminMarkDownContainer.state.retrieveError != null} />
      </fieldset>
    );
  }

}

PresentationForm.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  adminMarkDownContainer: PropTypes.instanceOf(AdminMarkDownContainer).isRequired,

};

const PresentationFormWrapperFC = (props) => {
  const { t } = useTranslation('admin');

  return <PresentationForm t={t} {...props} />;
};

const PresentationFormWrapper = withUnstatedContainers(PresentationFormWrapperFC, [AdminMarkDownContainer]);

export default PresentationFormWrapper;
