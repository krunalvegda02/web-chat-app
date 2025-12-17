
import { FaSpinner } from 'react-icons/fa';

export default function LoadingSpinner({ 
  size = 'large', 
  fullScreen = false,
  tip = 'Loading...' 
}) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div className="bg-slate-900 rounded-lg p-8 border border-slate-700">
          <FaSpinner size={size} tip={tip} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      <FaSpinner size={size} tip={tip} />
    </div>
  );
}