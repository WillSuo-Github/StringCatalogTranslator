import React, { useState } from 'react';
import './Startbutton.css';

interface ButtonProps {
  label: string;
  onClick: () => Promise<void>;
  loading: boolean; // 新增 loading prop
}

const Startbutton: React.FC<ButtonProps> = ({ label, onClick, loading }) => {
  const handleClick = async () => {
    try {
      await onClick();
    } catch (error) {
      // 处理错误
    }
  };

  return (
    <button
      className={`custom-button ${loading ? 'loading' : ''}`}
      onClick={handleClick}
      disabled={loading}
    >
      <span>{loading ? ' ' : label}</span>
      {loading && <div className="loader" />}
    </button>
  );
};

export default Startbutton;
