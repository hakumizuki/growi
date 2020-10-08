import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';

const NotFoundAlert = (props) => {
  const { t } = props;
  function clickHandler(viewType) {
    if (props.onPageCreateClicked) {
      props.onPageCreateClicked(viewType);
    }
    else {
      return null;
    }
  }

  return (
    <div className="grw-not-found-alert border m-4 p-4">
      <div className="col-md-12">
        <h2 className="text-muted not-found-text">
          <i className="icon-info" aria-hidden="true"></i>
          {t('not_found_page.page_not_exist_alert')}
        </h2>
        <button
          type="button"
          className="m-2 p-2"
          onClick={() => { clickHandler('edit') }}
        >
          <i className="icon-note icon-fw" />
          {t('not_found_page.Create Page')}
        </button>
      </div>
    </div>
  );
};


NotFoundAlert.propTypes = {
  t: PropTypes.func.isRequired, // i18next
  onPageCreateClicked: PropTypes.func,
};

export default withTranslation()(NotFoundAlert);
