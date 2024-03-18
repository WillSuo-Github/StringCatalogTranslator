import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, FC } from 'react';

import './App.css';
import Dropbox from './Dropbox';
import Checkbox from './Checkbox';
import APIKeyInput from './APIKeyInput';
import Startbutton from './Startbutton';


const MainApp: FC = () => {

  const [dropFile, setDropFile] = useState([File]);

  function handleDropComplete(files: File) {
    console.log('files:', files);
  }

  function handleCheckboxChange(checked: boolean) {
    console.log('checked:', checked);
  }

  function handleInputChange(value: string) {
    console.log('value:', value);
  }

  const simulateAsyncTask = () => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 3000); // 模拟3秒钟的延迟
    });
  };

  return (
    <div>
      <Dropbox dropComplete={ handleDropComplete } />
      <div className='APIKeyInputContainer'>
        <APIKeyInput placeholder='API Key' onChange={handleInputChange} />
        <Startbutton label='start' onClick={() => simulateAsyncTask()} />
      </div>
      <div className='checkboxContainer'>
        <div className='leftCheckboxContainer'>
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
        </div>
        <div className='rightCheckboxContainer'>
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
          <Checkbox label='start' checked={false} onChange={handleCheckboxChange} />
        </div>
      </div>
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
