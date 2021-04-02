import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import AppContainer from '../../../services/AppContainer';
import { withUnstatedContainers } from '../../UnstatedUtils';
import { toastSuccess, toastError } from '../../../util/apiNotification';

const AccessTokenSettings = (props) => {
  const { t } = useTranslation('admin');

  const discardTokenHandler = () => {
    if (props.discardTokenHandler != null) {
      props.discardTokenHandler();
    }
  }

  const generateTokenHandler = () => {
    if (props.generateTokenHandler != null) {
      props.generateTokenHandler();
    }
  }

  const textboxClickHandler = (e) => {
    e.target.select();
    if (props.accessToken != null) {
      navigator.clipboard.writeText(props.accessToken)
        .then(() => { toastSuccess('slack_integration.copied_to_clipboard') });
    }
  };

  return (
    <div className="row">
      <div className="col-lg-12">

        <h2 className="admin-setting-header">Access Token</h2>

        <div className="form-group row my-5">
          <label className="text-left text-md-right col-md-3 col-form-label">Access Token</label>
          <div className="col-md-6">
            <input className="form-control" type="text" value={props.accessToken} onClick={e => textboxClickHandler(e)} readOnly />
          </div>
        </div>

        <div className="row">
          <div className="mx-auto">
            <button type="button" className="btn btn-outline-secondary text-nowrap mx-1" onClick={discardTokenHandler}>
              {t('slack_integration.access_token_settings.discard')}
            </button>
            <button type="button" className="btn btn-primary text-nowrap mx-1" onClick={generateTokenHandler}>
              {t('slack_integration.access_token_settings.generate')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

const AccessTokenSettingsWrapper = withUnstatedContainers(AccessTokenSettings, [AppContainer]);

AccessTokenSettings.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  accessToken: PropTypes.string,
  discardTokenHandler: PropTypes.func,
  generateTokenHandler: PropTypes.func,
};

export default AccessTokenSettingsWrapper;
