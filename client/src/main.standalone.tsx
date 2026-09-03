import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { createPortal } from 'react-dom';

import PostmanPage from './pages/PostmanPage/PostmanPage';
import './index.standalone.css';
import { Toaster } from '@client/src/components/ui/sonner';

const NotFound = () => (
  <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
    <h1>404</h1>
    <p>页面不存在</p>
  </div>
);

const MainApp = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div style={{ padding: 20, color: 'red' }}>
            <h2>应用出错了</h2>
            <pre>{error instanceof Error ? error.message : String(error)}</pre>
            <button onClick={resetErrorBoundary}>重试</button>
          </div>
        )}
      >
        <Routes>
          <Route index element={<PostmanPage />} />
          <Route path="postman" element={<PostmanPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {createPortal(<Toaster />, document.body)}
      </ErrorBoundary>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')!).render(<MainApp />);
