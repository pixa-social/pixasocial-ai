import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Use HashRouter for development environments to handle complex sub-paths where 
// the app is not served from the root. Build tools like Bun set NODE_ENV to 'development' for dev servers.
// Use BrowserRouter for production builds to ensure clean URLs and proper OAuth compatibility.
const isProduction = process.env.NODE_ENV === 'production';
const Router = isProduction ? BrowserRouter : HashRouter;

root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
