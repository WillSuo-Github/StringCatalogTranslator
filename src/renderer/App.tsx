import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, FC } from 'react';

import './App.css';
import Dropbox from './Dropbox';
import Checkbox from './Checkbox';
import APIKeyInput from './APIKeyInput';
import Startbutton from './Startbutton';
import OpenAITranslator from '../main/OpenAITranslator'


interface TranslationFile {
  filePaths: string[];
  openAIKey: string;
  rewriteAll: boolean;
}

interface TranslationFileResponse {
  success: boolean;
  message: string;
}

const MainApp: FC = () => {
  const [dropFiles, setDropFiles] = useState<File[]>([]);
  const [apikey, setApikey] = useState<string>('');

  function handleDropComplete(files: [File]) {
    setDropFiles(files);
  }

  function handleCheckboxChange(checked: boolean) {
    console.log('checked:', checked);
  }

  function handleInputChange(value: string) {
    setApikey(value);
  }

  function simulateAsyncTask() {
    return new Promise<void>((resolve) => {
      if (dropFiles.length > 0) {
        let filePaths: string[] = dropFiles.map(file => file.path);

        let translationFile: TranslationFile = {
          filePaths: filePaths,
          openAIKey: apikey,
          rewriteAll: false
        }
        console.log('file:', filePaths);
        window.electron.ipcRenderer.sendMessage('fileChannel', translationFile);
        window.electron.ipcRenderer.once('fileChannel', (response: TranslationFileResponse) => {
          console.log('response:', response);
          resolve();
        });
      } else {
        console.log('no file');
        resolve();
      }
    });
  };

  return (
    <div>
      <Dropbox dropComplete={handleDropComplete} />
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
