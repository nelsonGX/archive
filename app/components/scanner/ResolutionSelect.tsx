"use client"

import { ChangeEvent } from 'react';

export interface Resolution {
  width: number;
  height: number;
  label: string;
}

const DEFAULT_RESOLUTIONS: Resolution[] = [
  { width: 1280, height: 720, label: 'HD (720p)' },
  { width: 1920, height: 1080, label: 'Full HD (1080p)' },
  { width: 3840, height: 2160, label: '4K' },
];

interface ResolutionSelectProps {
  resolutions?: Resolution[];
  selectedResolution: Resolution;
  onSelect: (resolution: Resolution) => void;
}

export default function ResolutionSelect({
  resolutions = DEFAULT_RESOLUTIONS,
  selectedResolution,
  onSelect,
}: ResolutionSelectProps) {
  
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [width, height] = value.split('x').map(Number);
    const resolution = resolutions.find(r => r.width === width && r.height === height) || resolutions[0];
    onSelect(resolution);
  };

  return (
    <div>
      <label htmlFor="resolution-select" className="block text-sm font-medium mb-1">
        Resolution
      </label>
      <select
        id="resolution-select"
        value={`${selectedResolution.width}x${selectedResolution.height}`}
        onChange={handleChange}
        className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900"
      >
        {resolutions.map((resolution) => (
          <option 
            key={`${resolution.width}x${resolution.height}`} 
            value={`${resolution.width}x${resolution.height}`}
          >
            {resolution.label}
          </option>
        ))}
      </select>
    </div>
  );
}