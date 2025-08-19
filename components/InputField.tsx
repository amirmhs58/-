
import React from 'react';
import Tooltip from './Tooltip';

interface InputFieldProps {
  label: string;
  id: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  unit?: string;
  tooltip?: string;
  error?: string;
  min?: string;
  step?: string;
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const InputField: React.FC<InputFieldProps> = ({ label, id, type, value, onChange, unit, tooltip, error, min, step }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 flex items-center text-sm font-medium text-gray-700">
        {label}
        {tooltip && (
          <Tooltip text={tooltip}>
            <span className="ms-2">
              <InfoIcon />
            </span>
          </Tooltip>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          min={min}
          step={step}
          className={`block w-full rounded-lg border p-2.5 text-gray-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
        />
        {unit && <span className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-500">{unit}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default InputField;
