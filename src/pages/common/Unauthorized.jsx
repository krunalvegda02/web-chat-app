import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Result
        status="403"
        title="Access Denied"
        subTitle="You don't have permission to access this page."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Go Back
          </Button>
        }
      />
    </div>
  );
}