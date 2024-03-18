import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, FC } from 'react';

import './App.css';
import Dropbox from './Dropbox';

const MainApp: FC = () => {

  const [dropFile, setDropFile] = useState([File]);

  function handleDropComplete(files: File) {
    console.log('files:', files);
  }

  return (
    <div>
      <Dropbox dropComplete={ handleDropComplete } />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
};
