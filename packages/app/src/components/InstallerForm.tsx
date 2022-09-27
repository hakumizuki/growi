import React, { FC, useEffect, useState } from 'react';

import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

import { localeMetadatas } from '~/client/util/i18n';
import { useCsrfToken } from '~/stores/context';

type Props = {
  userName?: string
  name?: string
  email?: string
}

const InstallerForm: FC<Props> = (props: Props) => {
  const { t } = useTranslation();
  const { data: csrfToken } = useCsrfToken();

  const [isValidUserName, setValidUserName] = useState(true);
  const [isSubmittingDisabled, setSubmittingDisabled] = useState(false);
  const [selectedLang, setSelectedLang] = useState<any>({});

  useEffect(() => {
    const meta = localeMetadatas.find(v => v.id === i18next.language);
    if (meta == null) {
      return setSelectedLang(localeMetadatas[0]);
    }
    setSelectedLang(meta);
  }, []);

  // checkUserName(event) {
  //   const axios = require('axios').create({
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-Requested-With': 'XMLHttpRequest',
  //     },
  //     responseType: 'json',
  //   });
  //   axios.get('/_api/v3/check-username', { params: { username: event.target.value } })
  //     .then((res) => { return this.setState({ isValidUserName: res.data.valid }) });
  // }

  const changeLanguage = (meta) => {
    i18next.changeLanguage(meta.id);
    setSelectedLang(meta);
  };

  const submitHandler = () => {
    if (isSubmittingDisabled) {
      return;
    }

    setSubmittingDisabled(true);
    setTimeout(() => {
      setSubmittingDisabled(false);
    }, 3000);
  };

  const hasErrorClass = isValidUserName ? '' : ' has-error';
  const unavailableUserId = isValidUserName
    ? ''
    : <span><i className="icon-fw icon-ban" />{ t('installer.unavaliable_user_id') }</span>;

  return (
    <div data-testid="installerForm" className={`login-dialog p-3 mx-auto${hasErrorClass}`}>
      <div className="row mt-4">
        <div className="col-md-12">
          <p className="alert alert-success">
            <strong>{ t('installer.create_initial_account') }</strong><br />
            <small>{ t('installer.initial_account_will_be_administrator_automatically') }</small>
          </p>
        </div>
      </div>
      <div className="row">
        <form role="form" action="/installer" method="post" id="register-form" className="col-md-12" onSubmit={submitHandler}>
          <div className="dropdown mb-3">
            <div className="d-flex dropdown-with-icon">
              <i className="icon-bubbles border-0 rounded-0" />
              <button
                type="button"
                className="btn btn-secondary dropdown-toggle text-right w-100 border-0 shadow-none"
                id="dropdownLanguage"
                data-testid="dropdownLanguage"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="true"
              >
                <span className="float-left">
                  {selectedLang.displayName}
                </span>
              </button>
              <input
                type="hidden"
                value={selectedLang.id}
                name="registerForm[app:globalLang]"
              />
              <div className="dropdown-menu" aria-labelledby="dropdownLanguage">
                {
                  localeMetadatas.map(meta => (
                    <button
                      key={meta.id}
                      data-testid={`dropdownLanguageMenu-${meta.id}`}
                      className="dropdown-item"
                      type="button"
                      onClick={() => changeLanguage(meta)}
                    >
                      {meta.displayName}
                    </button>
                  ))
                }
              </div>
            </div>
          </div>

          <div className={`input-group mb-3${hasErrorClass}`}>
            <div className="input-group-prepend">
              <span className="input-group-text"><i className="icon-user" /></span>
            </div>
            <input
              data-testid="tiUsername"
              type="text"
              className="form-control"
              placeholder={t('User ID')}
              name="registerForm[username]"
              defaultValue={props.userName}
              // onBlur={this.checkUserName} // need not to check username before installation -- 2020.07.24 Yuki Takei
              required
            />
          </div>
          <p className="form-text">{ unavailableUserId }</p>

          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text"><i className="icon-tag" /></span>
            </div>
            <input
              data-testid="tiName"
              type="text"
              className="form-control"
              placeholder={t('Name')}
              name="registerForm[name]"
              defaultValue={props.name}
              required
            />
          </div>

          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text"><i className="icon-envelope" /></span>
            </div>
            <input
              data-testid="tiEmail"
              type="email"
              className="form-control"
              placeholder={t('Email')}
              name="registerForm[email]"
              defaultValue={props.email}
              required
            />
          </div>

          <div className="input-group mb-3">
            <div className="input-group-prepend">
              <span className="input-group-text"><i className="icon-lock" /></span>
            </div>
            <input
              data-testid="tiPassword"
              type="password"
              className="form-control"
              placeholder={t('Password')}
              name="registerForm[password]"
              required
            />
          </div>

          <input type="hidden" name="_csrf" value={csrfToken} />

          <div className="input-group mt-4 mb-3 d-flex justify-content-center">
            <button
              data-testid="btnSubmit"
              type="submit"
              className="btn-fill btn btn-register"
              id="register"
              disabled={isSubmittingDisabled}
            >
              <div className="eff"></div>
              <span className="btn-label"><i className="icon-user-follow" /></span>
              <span className="btn-label-text">{ t('Create') }</span>
            </button>
          </div>

          <div className="input-group mt-4 d-flex justify-content-center">
            <a href="https://growi.org" className="link-growi-org">
              <span className="growi">GROWI</span>.<span className="org">ORG</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstallerForm;
