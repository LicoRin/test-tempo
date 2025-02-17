import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RedirectPage from './components/RedirectPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/r/:code" element={<RedirectPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);