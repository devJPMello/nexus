import { useState, useEffect } from 'react';
import './LoadingDots.css';

const LoadingDots = ({ size = 'medium', color = '#666' }) => {
  return (
    <div className="loading-dots-container">
      <div className="loading-dots">
        <span className={`dot dot-1 ${size}`} style={{ backgroundColor: color }}></span>
        <span className={`dot dot-2 ${size}`} style={{ backgroundColor: color }}></span>
        <span className={`dot dot-3 ${size}`} style={{ backgroundColor: color }}></span>
      </div>
    </div>
  );
};

export default LoadingDots;