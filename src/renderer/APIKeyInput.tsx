import React from 'react';
import './APIKeyInput.css';

interface InputBoxProps {
    placeholder?: string;
    onChange?: (value: string) => void;
}

const APIKeyInput: React.FC<InputBoxProps> = ({ placeholder, onChange }) => {
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target;
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <div className="input-container">
            <input
                type="text"
                className="input-box"
                placeholder={placeholder}
                onChange={handleInputChange}
            />
        </div>
    );
};

export default APIKeyInput;
