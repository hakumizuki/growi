
import React, { useEffect } from 'react';

import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import PersonalContainer from '~/client/services/PersonalContainer';
import { toastSuccess, toastError } from '~/client/util/apiNotification';
import { localeMetadatas } from '~/client/util/i18n';
import { usePersonalSettingsInfo } from '~/stores/personal-settings';

import { withUnstatedContainers } from '../UnstatedUtils';


class BasicInfoSettings extends React.Component {

  constructor() {
    super();

    this.onClickSubmit = this.onClickSubmit.bind(this);
  }

  // async componentDidMount() {
  // this.props.syncPersonalSettingsInfo();
  // try {
  //   await this.props.personalContainer.retrievePersonalData();
  // }
  // catch (err) {
  //   toastError(err);
  // }
  // }

  async onClickSubmit() {
    const { t, personalContainer } = this.props;

    try {
      await personalContainer.updateBasicInfo();
      toastSuccess(t('toaster.update_successed', { target: t('Basic Info') }));
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const { t, personalContainer, personalSettingsInfo } = this.props;
    const { registrationWhiteList } = personalContainer.state;

    console.log({ personalSettingsInfo });

    return (
      <>

        <div className="form-group row">
          <label htmlFor="userForm[name]" className="text-left text-md-right col-md-3 col-form-label">{t('Name')}</label>
          <div className="col-md-6">
            <input
              className="form-control"
              type="text"
              name="userForm[name]"
              // defaultValue={personalContainer.state.name}
              defaultValue={personalSettingsInfo.name}
              onChange={(e) => { personalContainer.changeName(e.target.value) }}
            />
          </div>
        </div>

        <div className="form-group row">
          <label htmlFor="userForm[email]" className="text-left text-md-right col-md-3 col-form-label">{t('Email')}</label>
          <div className="col-md-6">
            <input
              className="form-control"
              type="text"
              name="userForm[email]"
              // defaultValue={personalContainer.state.email}
              defaultValue={personalSettingsInfo.email}
              onChange={(e) => { personalContainer.changeEmail(e.target.value) }}
            />
            {registrationWhiteList.length !== 0 && (
              <div className="form-text text-muted">
                {t('page_register.form_help.email')}
                <ul>
                  {registrationWhiteList.map(data => <li key={data}><code>{data}</code></li>)}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="form-group row">
          <label className="text-left text-md-right col-md-3 col-form-label">{t('Disclose E-mail')}</label>
          <div className="col-md-6">
            <div className="custom-control custom-radio custom-control-inline">
              <input
                type="radio"
                id="radioEmailShow"
                className="custom-control-input"
                name="userForm[isEmailPublished]"
                // checked={personalContainer.state.isEmailPublished}
                checked={personalSettingsInfo.isEmailPublished}
                onChange={() => { personalContainer.changeIsEmailPublished(true) }}
              />
              <label className="custom-control-label" htmlFor="radioEmailShow">{t('Show')}</label>
            </div>
            <div className="custom-control custom-radio custom-control-inline">
              <input
                type="radio"
                id="radioEmailHide"
                className="custom-control-input"
                name="userForm[isEmailPublished]"
                // checked={!personalContainer.state.isEmailPublished}
                checked={!personalSettingsInfo.isEmailPublished}
                onChange={() => { personalContainer.changeIsEmailPublished(false) }}
              />
              <label className="custom-control-label" htmlFor="radioEmailHide">{t('Hide')}</label>
            </div>
          </div>
        </div>

        <div className="form-group row">
          <label className="text-left text-md-right col-md-3 col-form-label">{t('Language')}</label>
          <div className="col-md-6">
            {
              localeMetadatas.map(meta => (
                <div key={meta.id} className="custom-control custom-radio custom-control-inline">
                  <input
                    type="radio"
                    id={`radioLang${meta.id}`}
                    className="custom-control-input"
                    name="userForm[lang]"
                    // checked={personalContainer.state.lang === meta.id}
                    checked={personalSettingsInfo.lang === meta.id}
                    onChange={() => { personalContainer.changeLang(meta.id) }}
                  />
                  <label className="custom-control-label" htmlFor={`radioLang${meta.id}`}>{meta.displayName}</label>
                </div>
              ))
            }
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="userForm[slackMemberId]" className="text-left text-md-right col-md-3 col-form-label">{t('Slack Member ID')}</label>
          <div className="col-md-6">
            <input
              className="form-control"
              type="text"
              // key={personalContainer.state.slackMemberId}
              key={personalSettingsInfo.slackMemberId}
              name="userForm[slackMemberId]"
              // defaultValue={personalContainer.state.slackMemberId}
              defaultValue={personalSettingsInfo.slackMemberId}
              onChange={(e) => { personalContainer.changeSlackMemberId(e.target.value) }}
            />
          </div>
        </div>

        <div className="row my-3">
          <div className="offset-4 col-5">
            <button
              data-testid="grw-besic-info-settings-update-button"
              type="button"
              className="btn btn-primary"
              onClick={this.onClickSubmit}
              disabled={personalContainer.state.retrieveError != null}
            >
              {t('Update')}
            </button>
          </div>
        </div>

      </>
    );
  }

}

BasicInfoSettings.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  personalContainer: PropTypes.instanceOf(PersonalContainer).isRequired,
  personalSettingsInfo: PropTypes.object,
  mutatePersonalSettingsInfo: PropTypes.func,
};

const BasicInfoSettingsWrapperFC = (props) => {
  const { t } = useTranslation();
  // const { data: personalSettingsInfo, mutate: mutatePersonalSettingsInfo, sync: syncPersonalSettingsInfo } = usePersonalSettingsInfo();
  const swrResult = usePersonalSettingsInfo();


  useEffect(() => {
    // Sync only when getting personal settings data from DB
    swrResult.sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swrResult.personalSettingsDataFromDB]);

  return (
    <BasicInfoSettings
      t={t}
      personalSettingsInfo={swrResult.data || {}}
      mutatePersonalSettingsInfo={swrResult.mutate}
      {...props}
    />
  );
};

/**
 * Wrapper component for using unstated
 */
const BasicInfoSettingsWrapper = withUnstatedContainers(BasicInfoSettingsWrapperFC, [PersonalContainer]);

export default BasicInfoSettingsWrapper;
