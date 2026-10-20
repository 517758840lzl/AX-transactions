import React from 'react';
import './globals.css';
import themeData from './theme.json';
import previewAsset from './assets/cover.svg?url';

const Component: React.FC = () => <main className={themeData.display?.variant === 'mobile-product' ? 'theme-import-page theme-import-mobile' : 'theme-import-page'}><h1>{themeData.identity.titleEn}</h1><p>{themeData.display?.descriptionEn || themeData.display?.description}</p><img src={previewAsset} alt={themeData.identity.titleEn} /><button type="button">Preview theme</button></main>;
export default Component;
