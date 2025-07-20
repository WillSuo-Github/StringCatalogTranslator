import React, { useState } from 'react';
import './Dropbox.css'; // 样式文件
import icon from './resource/upload-icon.png';
import fileIcon from './resource/file-icon.png';
import closeButton from './resource/close-button.png';

type DropboxCompletion = (files: File[]) => void;

type DropboxProps = {
  readonly dropComplete: DropboxCompletion;
};

export default function Dropbox({ dropComplete }: DropboxProps) {
  const [dragging, setDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
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

    const files = Array.from(e.dataTransfer.files);
    dropComplete(files);
    setDroppedFiles(files);
  };

  const handleRemoveFile = () => {
    setDroppedFiles([]);
  };

  return (
    <div
      className={`drag-and-drop ${dragging ? 'dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {droppedFiles.length === 0 ? (
        <div className="drag-and-drop-content">
          <div className="drag-and-drop-icon">
            {/* 这里放置用于提示用户拖入文件的图标 */}
            <img src={icon} alt="" />
          </div>
          <div className="drag-and-drop-text">
            Drag and drop files here to upload
          </div>
        </div>
      ) : (
        <div className="dropped-files">
          <div className="icon-container">
            <img src={fileIcon} alt="" />
          </div>
          <div className="dropped-file-list">
            {droppedFiles.map((file, index) => file.name).join(',')}
          </div>
          <button className="delete-button" onClick={() => handleRemoveFile()}>
            <img src={closeButton} alt="" />
          </button>
        </div>
      )}
    </div>
  );
}
