import React, { useState } from 'react';
import './Dropbox.css'; // 样式文件
import icon from './resource/upload-icon.png';

type DropboxCompletion = (files: [File]) => string;

type DropboxProps = {
  readonly dropComplete: DropboxCompletion;
};

export default function Dropbox({ dropComplete }) {
  const [dragging, setDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const files = [...e.dataTransfer.files];
    // 处理拖入的文件，例如上传文件或其他操作
    dropComplete(files);
  };

  return (
    <div
      className={`drag-and-drop ${dragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="drag-and-drop-content">
        <div className="drag-and-drop-icon">
          {/* 这里放置用于提示用户拖入文件的图标，可以使用任何你想要的图标库或自定义图标 */}
          <img src={icon} alt="" />
        </div>
        <div className="drag-and-drop-text">
          拖动文件到此处上传
        </div>
      </div>
    </div>
  );
};
