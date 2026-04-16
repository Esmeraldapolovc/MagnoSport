// components/Alert.jsx
import { useEffect } from 'react';
import '../assets/styles/Alert.css';

const Alert = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`custom-alert custom-alert-${type}`}>
      <div className="alert-content">
        {type === 'success' && (
          <svg className="alert-icon" viewBox="0 0 24 24" width="48" height="48">
            <circle cx="12" cy="12" r="10" className="alert-circle" stroke="currentColor" fill="none" strokeWidth="2" />
            <path d="M8 12l3 3 6-6" className="alert-check" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="alert-icon" viewBox="0 0 24 24" width="48" height="48">
            <circle cx="12" cy="12" r="10" className="alert-circle" stroke="currentColor" fill="none" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" className="alert-cross" stroke="currentColor" fill="none" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        <p className="alert-message">{message}</p>
      </div>
    </div>
  );
};

export default Alert;