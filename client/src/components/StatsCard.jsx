import { useEffect, useState } from 'react';
import './StatsCard.css';

function StatsCard({ title, value, icon, color, suffix = '' }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const numericValue = parseFloat(value) || 0;
    const duration = 1500;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setAnimatedValue(numericValue);
        clearInterval(timer);
      } else {
        setAnimatedValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const formatValue = (val) => {
    if (Number.isInteger(parseFloat(value))) {
      return Math.floor(val);
    }
    return val.toFixed(1);
  };

  return (
    <div className={`stats-card ${isVisible ? 'visible' : ''}`} style={{ '--card-color': color }}>
      <div className="stats-card-icon" style={{ background: `${color}20`, color }}>
        <i className={`fa ${icon}`}></i>
      </div>
      <div className="stats-card-content">
        <h3>{title}</h3>
        <p className="stats-value">
          {formatValue(animatedValue)}{suffix}
        </p>
      </div>
      <div className="stats-card-glow"></div>
    </div>
  );
}

export default StatsCard;
