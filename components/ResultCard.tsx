
import React from 'react';

interface ResultCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit: string;
  description?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ icon, title, value, unit, description }) => {
  return (
    <div className="transform rounded-xl bg-white p-6 shadow-md transition-transform hover:scale-105">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-800">
            {value} <span className="text-xl font-semibold text-gray-600">{unit}</span>
          </p>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
