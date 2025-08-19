
import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full mb-2 hidden w-48 rounded-md bg-gray-800 p-2 text-center text-xs text-white group-hover:block transition-opacity duration-300 z-10">
        {text}
      </div>
    </div>
  );
};

export default Tooltip;
