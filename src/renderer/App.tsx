import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import React, { useState, FC } from 'react';

import './App.css';
import Dropbox from './Dropbox';
import Checkbox from './Checkbox';
import APIKeyInput from './APIKeyInput';
import Startbutton from './Startbutton';


export interface TranslationFile {
  filePaths: string[];
  openAIKey: string;
  rewriteAll: boolean;
}

export interface TranslationFileResponse {
  // "done", "in-progress", "error"
  progress: string;
  message: string;
}

const MainApp: FC = () => {
  const [dropFiles, setDropFiles] = useState<File[]>([]);
  const [apikey, setApikey] = useState<string>('');
  const [tips, setTips] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function handleDropComplete(files: [File]) {
    setDropFiles(files);
  }

  function handleCheckboxChange(checked: boolean) {
    console.log('checked:', checked);
  }

  function handleInputChange(value: string) {
    setApikey(value);
  }

  function handleStartTranslation() {
    startButtonLoading();

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
        window.electron.ipcRenderer.on('fileChannel', (response: TranslationFileResponse) => {
          console.log('response:', response);
          resolve();
          setTips(response.message);

          if (response.progress === 'done') {
            stopButtonLoading();
          }
        });
      } else {
        console.log('no file');
        resolve();
      }
    });
  };

  function stopButtonLoading() {
    setLoading(false);
  };

  function startButtonLoading() {
    setLoading(true);
  }

  return (
    <div>
      <Dropbox dropComplete={handleDropComplete} />
      <div className='tips'>{ tips }</div>
      <div className='APIKeyInputContainer'>
        <APIKeyInput placeholder='API Key' onChange={handleInputChange} />
        <Startbutton label='start' onClick={handleStartTranslation} loading={loading} />
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
