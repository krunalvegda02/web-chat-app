import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Spin, Result } from 'antd';
import SignupWithInviteForm from './SignUpwithInviteForm';
import { fetchInviteInfo } from '../../redux/slices/authSlice';

export default function JoinPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const { inviteInfo, inviteLoading, inviteError } = useSelector((s) => s.auth);

    const token = searchParams.get('token');
    const tenantId = searchParams.get('tenantId');

    useEffect(() => {
        if (token && tenantId) {
            dispatch(fetchInviteInfo({ token, tenantId }));
        }
    }, [dispatch, token, tenantId]);

    if (!token || !tenantId) {
        return (
            <div className="h-screen flex items-center justify-center p-4">
                <Result
                    status="error"
                    title="Invalid Invite Link"
                    subTitle="Missing required parameters"
                    extra={
                        <Button type="primary" onClick={() => navigate('/login')}>
                            Back to Login
                        </Button>
                    }
                />
            </div>
        );
    }

    if (inviteLoading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    if (inviteError) {
        return (
            <div className="h-screen flex items-center justify-center p-4">
                <Result
                    status="error"
                    title="Invalid Invite Link"
                    subTitle={inviteError}
                    extra={
                        <Button type="primary" onClick={() => navigate('/login')}>
                            Back to Login
                        </Button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-100 via-indigo-100 to-pink-100 flex items-center justify-center p-4">
            <SignupWithInviteForm
                token={token}
                tenantId={tenantId}
                inviteInfo={inviteInfo}
            />
        </div>
    );
}
