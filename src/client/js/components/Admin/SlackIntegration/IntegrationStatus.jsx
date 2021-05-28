import React from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { UncontrolledTooltip } from 'reactstrap';

import ConductionStatusHr from './ConductionStatusHr';

const IntegrationSuccess = (props) => {
  const { t } = useTranslation();
  const { errorCount, totalCount } = props;

  return (
    <>
      <div className="d-none d-lg-block">
        <p className="text-success small mt-5">
          <i className="fa fa-check mr-1" />
          {t('admin:slack_integration.integration_sentence.integration_successful')}
        </p>
        <div className="pt-2">
          <div className="position-relative mt-5">
            <div className="circle position-absolute bg-primary border-light">
              <p className="circle-inner text-light font-weight-bold">Proxy Server</p>
            </div>
          </div>
        </div>
        <ConductionStatusHr errorCount={errorCount} totalCount={totalCount} />
      </div>
      <div id="integration-line-for-tooltip" className="d-block d-lg-none mt-5">
        <i className="fa fa-check mr-1 text-success" />
        <ConductionStatusHr errorCount={errorCount} totalCount={totalCount} />
      </div>
      <UncontrolledTooltip placement="top" fade={false} target="integration-line-for-tooltip">
        <small>
          {t('admin:slack_integration.integration_sentence.integration_successful')}
        </small>
      </UncontrolledTooltip>
    </>
  );
};

IntegrationSuccess.propTypes = {
  errorCount: PropTypes.number.isRequired,
  totalCount: PropTypes.array.isRequired,
};


const IntegrationFailed = (props) => {
  const { t } = useTranslation();
  const { errorCount, totalCount } = props;

  return (
    <>
      <div className="d-none d-lg-block">
        <p className="mt-4">
          <small
            className="text-danger m-0"
          // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: t('admin:slack_integration.integration_sentence.integration_is_not_complete') }}
          />
        </p>
        <div className="pt-2">
          <div className="position-relative mt-5">
            <div className="circle position-absolute bg-primary border-light">
              <p className="circle-inner text-light font-weight-bold">Proxy Server</p>
            </div>
          </div>
        </div>
        <ConductionStatusHr errorCount={errorCount} totalCount={totalCount} />
      </div>
      <div id="integration-line-for-tooltip" className="d-block d-lg-none mt-5">
        <i className="icon-info text-danger" />
        <ConductionStatusHr errorCount={errorCount} totalCount={totalCount} />
      </div>
      <UncontrolledTooltip placement="top" fade={false} target="integration-line-for-tooltip">
        <small
          className="m-0"
        // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: t('admin:slack_integration.integration_sentence.integration_is_not_complete') }}
        />
      </UncontrolledTooltip>
    </>
  );
};

IntegrationFailed.propTypes = {
  errorCount: PropTypes.number.isRequired,
  totalCount: PropTypes.array.isRequired,

};


const SomeWorkSpacesNotIntegration = (props) => {
  const { t } = useTranslation();
  const { errorCount, totalCount } = props;

  return (
    <>
      <div className="d-none d-lg-block">
        <p className="mt-4">
          <small
            className="text-danger m-0"
          // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: t('admin:slack_integration.integration_sentence.integration_some_ws_is_not_complete') }}
          />
        </p>
        <div className="pt-2">
          <div className="position-relative mt-5">
            <div className="circle position-absolute bg-primary border-light">
              <p className="circle-inner text-light font-weight-bold">Proxy Server</p>
            </div>
          </div>
        </div>
        <ConductionStatusHr errorCount={errorCount} totalCount={totalCount} />
      </div>
      <div id="integration-line-for-tooltip" className="d-block d-lg-none mt-5">
        <i className="icon-info text-danger" />
        <ConductionStatusHr errorCount={errorCount} totalCount={totalCount} />
      </div>
      <UncontrolledTooltip placement="top" fade={false} target="integration-line-for-tooltip">
        <small
          className="m-0"
        // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: t('admin:slack_integration.integration_sentence.integration_some_ws_is_not_complete') }}
        />
      </UncontrolledTooltip>
    </>
  );
};

SomeWorkSpacesNotIntegration.propTypes = {
  errorCount: PropTypes.number.isRequired,
  totalCount: PropTypes.array.isRequired,

};


const IntegrationStatus = (props) => {
  const { workspaceNames } = props;

  let errorCount = 0;
  workspaceNames.forEach((w) => {
    if (w == null) {
      errorCount++;
    }
  });

  return (
    <>
      {errorCount === 0 && workspaceNames.length !== 0 && (
      <IntegrationSuccess
        errorCount={errorCount}
        totalCount={workspaceNames.length}
      />
      )}
      {errorCount === workspaceNames.length && (
      <IntegrationFailed
        errorCount={errorCount}
        totalCount={workspaceNames.length}
      />
      )}

      {errorCount >= 1 && errorCount < workspaceNames.length && (
      <SomeWorkSpacesNotIntegration
        errorCount={errorCount}
        totalCount={workspaceNames.length}
      />
      )}
    </>
  );
};

IntegrationStatus.propTypes = {
  workspaceNames: PropTypes.array.isRequired,
};

export default IntegrationStatus;