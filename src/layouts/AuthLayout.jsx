import { Layout } from 'antd';
import ThemeProvider from '../components/common/ThemeProvider';
import { Outlet } from 'react-router-dom';

const { Content } = Layout;


export default function AuthLayout() {
  return (
    <ThemeProvider>
      <Layout className=" bg-gradient-to-br from-white via-blue-50 to-purple-50">
        {/* Centered Content */}
        <Content className="flex items-center justify-center px-4 py-8">
          <Outlet />
        </Content>
      </Layout>
    </ThemeProvider>
  );
}
