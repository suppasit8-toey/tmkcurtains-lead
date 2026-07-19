import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface MultiInputProps {
  label: string;
  value: string | undefined | null;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'tel' | 'email';
}

export default function MultiInput({ label, value, onChange, placeholder, type = 'text' }: MultiInputProps) {
  // Parse comma separated values into an array, default to one empty string if empty
  const values = value ? value.split(',').map(s => s.trim()) : [''];
  if (values.length === 0) values.push('');

  const handleUpdate = (index: number, newValue: string) => {
    const newValues = [...values];
    newValues[index] = newValue;
    // Join with comma, filter out completely empty ones if we are saving, but keep them while editing
    // Actually, just join them, and let the user have empty strings between commas if they want.
    onChange(newValues.join(', '));
  };

  const handleAdd = () => {
    onChange([...values, ''].join(', '));
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues.length > 0 ? newValues.join(', ') : '');
  };

  return (
    <div>
      <label className="label text-[11px] mb-2 block">{label}</label>
      <div className="flex flex-col gap-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input 
              type={type} 
              className="input-field text-sm py-2 flex-1" 
              placeholder={placeholder} 
              value={v} 
              onChange={(e) => handleUpdate(i, e.target.value)} 
            />
            {values.length > 1 && (
              <button 
                type="button"
                onClick={() => handleRemove(i)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 border border-transparent hover:border-red-100"
                title="ลบ"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        <button 
          type="button"
          onClick={handleAdd}
          className="flex items-center justify-center gap-1 mt-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 py-1.5 px-3 rounded-lg w-fit border border-blue-100 transition-colors"
        >
          <Plus size={14} /> เพิ่ม{label}
        </button>
      </div>
    </div>
  );
}
