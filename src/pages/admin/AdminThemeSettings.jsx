import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Space,
  Alert,
  Spin,
  ColorPicker,
  Upload,
  Divider,
} from 'antd';
import { BgColorsOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';

export default function AdminThemeSettings() {
  const dispatch = useDispatch();
  const { theme, updating } = useSelector((s) => s.theme);
  const [form] = Form.useForm();
  const [changed, setChanged] = useState(false);

  const handleFinish = () => {
    dispatch(
      // updateTenantTheme({
      //   tenantId: user.tenantId,
      //   theme: {
      //     ...values,
      //     primaryColor: values.primaryColor?.toHexString?.() || values.primaryColor,
      //     chatBubbleAdmin: values.chatBubbleAdmin?.toHexString?.() || values.chatBubbleAdmin,
      //     chatBubbleUser: values.chatBubbleUser?.toHexString?.() || values.chatBubbleUser,
      //   },
      // })
    );
    setChanged(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="!bg-slate-900 !border-slate-700 mb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <BgColorsOutlined className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Theme Customization</h1>
            <p className="text-slate-400">Customize your chat application appearance</p>
          </div>
        </div>

        <Alert
          message="All changes will be reflected immediately across your chat app"
          type="info"
          showIcon
          className="mb-6"
        />

        <Spin spinning={updating}>
          <Form
            form={form}
            layout="vertical"
            initialValues={theme}
            onFinish={handleFinish}
            onValuesChange={() => setChanged(true)}
          >
            {/* Logo Section */}
            <Divider orientation="left" className="!text-slate-300">
              Brand
            </Divider>

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  name="logoUrl"
                  label={<span className="text-slate-300">Logo URL</span>}
                >
                  <Input
                    placeholder="https://example.com/logo.png"
                    className="!bg-slate-800 !border-slate-700 !text-slate-100"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Color Section */}
            <Divider orientation="left" className="!text-slate-300">
              Colors
            </Divider>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="primaryColor"
                  label={<span className="text-slate-300">Primary Color</span>}
                >
                  <Input
                    type="color"
                    className="!bg-slate-800 !border-slate-700 !text-slate-100 !h-10"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="accentColor"
                  label={<span className="text-slate-300">Accent Color</span>}
                >
                  <Input
                    type="color"
                    className="!bg-slate-800 !border-slate-700 !text-slate-100 !h-10"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="chatBubbleAdmin"
                  label={<span className="text-slate-300">Admin Bubble Color</span>}
                >
                  <Input
                    type="color"
                    className="!bg-slate-800 !border-slate-700 !text-slate-100 !h-10"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="chatBubbleUser"
                  label={<span className="text-slate-300">User Bubble Color</span>}
                >
                  <Input
                    type="color"
                    className="!bg-slate-800 !border-slate-700 !text-slate-100 !h-10"
                  />
                </Form.Item>
              </Col>
            </Row>

            {/* Background */}
            <Divider orientation="left" className="!text-slate-300">
              Background
            </Divider>

            <Form.Item
              name="backgroundImageUrl"
              label={<span className="text-slate-300">Background Image URL</span>}
            >
              <Input
                placeholder="https://example.com/background.jpg"
                className="!bg-slate-800 !border-slate-700 !text-slate-100"
              />
            </Form.Item>

            <Space className="mt-6">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={updating}
                disabled={!changed}
              >
                Save Changes
              </Button>
              <Button onClick={() => form.resetFields()}>Reset</Button>
            </Space>
          </Form>
        </Spin>
      </Card>

      {/* Preview */}
      <Card className="!bg-slate-900 !border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Preview</h3>
        <div
          className="p-6 rounded-lg border border-slate-700"
          style={{ backgroundColor: theme.secondaryColor }}
        >
          <div className="space-y-2">
            <div
              className="p-3 rounded-lg text-white w-max text-sm"
              style={{ backgroundColor: theme.chatBubbleAdmin }}
            >
              Admin message
            </div>
            <div
              className="p-3 rounded-lg text-white w-max text-sm ml-auto"
              style={{ backgroundColor: theme.chatBubbleUser }}
            >
              User message
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

