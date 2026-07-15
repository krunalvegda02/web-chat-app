
import { FaSpinner } from 'react-icons/fa';

export default function LoadingSpinner({ 
  size = 'large', 
  fullScreen = false,
  tip = 'Loading...' 
}) {
  // Map string sizes to pixel values for react-icons
  const sizeMap = {
    small: '16px',
    default: '24px',
    large: '48px',
  };
  const iconSize = sizeMap[size] || size || '24px';

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-slate-900 rounded-lg p-8 border border-slate-700 flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-blue-500" size={iconSize} />
          {tip && <span className="text-slate-300 font-medium">{tip}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <FaSpinner className="animate-spin text-blue-500" size={iconSize} />
      {tip && <span className="text-slate-500 font-medium">{tip}</span>}
    </div>
  );
}