import React from 'react';
import ReactDOM from 'react-dom/client';
// You were importing './index.css', which contained uncompiled Tailwind directives.
// This now imports the newly generated file with the compiled CSS.
import './tailwind.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
