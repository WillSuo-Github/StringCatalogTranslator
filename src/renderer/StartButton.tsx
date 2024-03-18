import React, { useState } from 'react';
import './Startbutton.css';

interface ButtonProps {
    label: string;
    onClick: () => Promise<void>;
}

const Startbutton: React.FC<ButtonProps> = ({ label, onClick }) => {
    const [loading, setLoading] = useState<boolean>(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            await onClick();
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`custom-button ${loading ? 'loading' : ''}`}
            onClick={handleClick}
            disabled={loading}
        >
            <span>{loading ? ' ' : label}</span>
            {loading && <div className="loader"></div>}
        </button>
    );
};

export default Startbutton;
