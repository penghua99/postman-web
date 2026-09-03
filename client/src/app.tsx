import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import PostmanPage from './pages/PostmanPage/PostmanPage';
import NotFound from './pages/NotFound/NotFound';

const RoutesComponent = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PostmanPage />} />
        <Route path="postman" element={<PostmanPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
