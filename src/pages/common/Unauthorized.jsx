import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to access this page."
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        }
      />
    </div>
  );
}