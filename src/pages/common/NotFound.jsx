
// ============================================================================
// NOT FOUND PAGE - pages/common/NotFound.jsx
// ============================================================================

import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Result
        status="404"
        title="Page Not Found"
        subTitle="The page you're looking for doesn't exist or has been moved."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        }
      />
    </div>
  );
}

