import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/bauhaus-tokens.css';
import './styles/bauhaus-components.css';
import './index.css';
import AppRouter from './AppRouter';
import './styles/bauhaus-overrides.css';
import './styles/bauhaus-readability.css';
import './styles/bauhaus-legacy-sweep.css';
import './styles/bauhaus-interaction.css';
import './styles/bauhaus-spacing.css';
import './styles/bauhaus-layout-width.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
