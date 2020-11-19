import React from 'react';
import PropTypes from 'prop-types';

import { UncontrolledTooltip } from 'reactstrap';
import { withTranslation } from 'react-i18next';
import { withUnstatedContainers } from './UnstatedUtils';

import { toastError } from '../util/apiNotification';
import AppContainer from '../services/AppContainer';
import PageContainer from '../services/PageContainer';
import NavigationContainer from '../services/NavigationContainer';


class LikeButton extends React.Component {

  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  async handleClick() {
    const { pageContainer } = this.props;
    const isGuestUser = pageContainer.state.isGuestUser;

    if (isGuestUser) {
      return;
    }

    try {
      pageContainer.toggleLike();
    }
    catch (err) {
      toastError(err);
    }
  }

  render() {
    const {
      appContainer, navigationContainer, pageContainer, t,
    } = this.props;
    const { isGuestUser } = appContainer;
    const { editorMode } = navigationContainer.state;

    const isViewMode = editorMode === 'view';

    return (
      <div>
        {isViewMode
          && (
          <button
            type="button"
            id="like-button"
            onClick={this.handleClick}
            className={`btn btn-like border-0
            ${pageContainer.state.isLiked ? 'active' : ''} ${isGuestUser ? 'disabled' : ''}`}
          >
            <i className="icon-like mr-3"></i>
            <span className="total-likes">
              {pageContainer.state.sumOfLikers}
            </span>
          </button>
          )
        }

        {isGuestUser && (
        <UncontrolledTooltip placement="top" target="like-button" fade={false}>
          {t('Not available for guest')}
        </UncontrolledTooltip>
        )}
      </div>
    );
  }

}

/**
 * Wrapper component for using unstated
 */
const LikeButtonWrapper = withUnstatedContainers(LikeButton, [AppContainer, NavigationContainer, PageContainer]);

LikeButton.propTypes = {
  appContainer: PropTypes.instanceOf(AppContainer).isRequired,
  navigationContainer: PropTypes.instanceOf(NavigationContainer).isRequired,
  pageContainer: PropTypes.instanceOf(PageContainer).isRequired,
  t: PropTypes.func.isRequired,
  size: PropTypes.string,
};

export default withTranslation()(LikeButtonWrapper);
