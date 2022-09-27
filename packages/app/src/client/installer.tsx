import React, { FC, useState } from 'react';

import ReactDOM from 'react-dom';
import { I18nextProvider } from 'react-i18next';
import {
  Nav, NavItem, NavLink,
} from 'reactstrap';
import { SWRConfig } from 'swr';

import { swrGlobalConfiguration } from '~/utils/swr-utils';

import InstallerForm from '../components/InstallerForm';

import ContextExtractor from './services/ContextExtractor';
import { i18nFactory } from './util/i18n';

const i18n = i18nFactory();

const componentMappings = {};

const InstallerContainer: FC = () => {
  const [isCreateUserTab, setCreateUserTab] = useState(true);

  return (
    <div className="grw-custom-nav-tab">
      <Nav className="nav-title text-center w-100">
        <NavItem className={`col-6 p-0 ${isCreateUserTab ? 'active' : ''}`}>
          <NavLink type="button" className="text-white" onClick={() => setCreateUserTab(true)}>
            アカウント作成
          </NavLink>
        </NavItem>
        <NavItem className={`col-6 p-0 ${isCreateUserTab ? '' : 'active'}`}>
          <NavLink type="button" className="text-white" onClick={() => setCreateUserTab(false)}>
            データ移行
          </NavLink>
        </NavItem>
      </Nav>
      <hr className="my-0 grw-nav-slide-hr border-none" style={{ width: '50%', marginLeft: isCreateUserTab ? '0%' : '50%', borderColor: 'white' }} />
    </div>
  );
};

// render InstallerForm
const installerFormContainerElem = document.getElementById('installer-container');
if (installerFormContainerElem) {
  const userName = installerFormContainerElem.dataset.userName;
  const name = installerFormContainerElem.dataset.name;
  const email = installerFormContainerElem.dataset.email;

  Object.assign(componentMappings, {
    'installer-container': <InstallerForm userName={userName} name={name} email={email} />,
  });
}

const renderMainComponents = () => {
  Object.keys(componentMappings).forEach((key) => {
    const elem = document.getElementById(key);
    if (elem) {
      ReactDOM.render(
        <I18nextProvider i18n={i18n}>
          <SWRConfig value={swrGlobalConfiguration}>
            {componentMappings[key]}
          </SWRConfig>
        </I18nextProvider>,
        elem,
      );
    }
  });
};

// extract context before rendering main components
const elem = document.getElementById('growi-context-extractor');
if (elem != null) {
  ReactDOM.render(
    <SWRConfig value={swrGlobalConfiguration}>
      <ContextExtractor></ContextExtractor>
    </SWRConfig>,
    elem,
    renderMainComponents,
  );
}
else {
  renderMainComponents();
}
