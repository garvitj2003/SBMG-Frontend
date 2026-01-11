import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { getTooltipText } from '../../utils/tooltipTexts';

const Tooltip = ({ children, text, maxWidth = '300px' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && text && (
        <div
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translate(-50%, 0%)',
            backgroundColor: '#1f2937',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: '1.5',
            maxWidth: maxWidth,
            zIndex: 9999,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            pointerEvents: 'none',
            whiteSpace: 'normal',
            wordWrap: 'break-word'
          }}
        >
          {text}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '6px solid #1f2937'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;

export const InfoTooltip = ({
  tooltipKey = 'DEFAULT',
  text,
  size = 16,
  color = '#9CA3AF',
  style = {}
}) => {
  const tooltipText = text || getTooltipText(tooltipKey);

  return (
    <Tooltip text={tooltipText}>
      <Info
        size={size}
        color={color}
        style={{ cursor: 'help', ...style }}
      />
    </Tooltip>
  );
};

