import React, { useEffect } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { getGlobalPricing, updateGlobalPricing } from '../../redux/slices/settingSlice';
import { Card, Form, InputNumber, Button, Typography, message, Divider, Spin, Row, Col } from 'antd';
import { 
  SettingOutlined, 
  SaveOutlined,
  MessageOutlined,
  PictureOutlined,
  TranslationOutlined,
  AudioOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function SuperAdminSettings() {
  useAuthGuard(['SUPER_ADMIN']);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { pricing, loading, updateLoading } = useSelector((state) => state.setting);

  useEffect(() => {
    dispatch(getGlobalPricing());
  }, [dispatch]);

  useEffect(() => {
    if (pricing) {
      form.setFieldsValue({
        textCost: pricing.textCost !== undefined ? pricing.textCost : 5,
        mediaCost: pricing.mediaCost !== undefined ? pricing.mediaCost : 20,
        textTranslationCost: pricing.textTranslationCost !== undefined ? pricing.textTranslationCost : 10,
        voiceCost: pricing.voiceCost !== undefined ? pricing.voiceCost : 15,
        voiceTranslationCost: pricing.voiceTranslationCost !== undefined ? pricing.voiceTranslationCost : 25,
      });
    }
  }, [pricing, form]);

  const onFinish = async (values) => {
    try {
      await dispatch(updateGlobalPricing(values)).unwrap();
      message.success('Global pricing updated successfully');
    } catch (error) {
      message.error(error?.message || 'Failed to update pricing');
    }
  };

  return (
    <div
      className="h-screen sm:min-h-screen p-3 sm:p-4 md:p-6 overflow-y-auto"
      style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5', height: 'calc(100vh - 50px)' }}
    >
      <div className="mb-6">
        <Title level={2} style={{ color: theme.sidebarTextColor || '#111B21', margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>
          <SettingOutlined className="mr-2" /> Global Settings
        </Title>
        <Text style={{ color: theme.timestampColor || '#667781', fontSize: '14px' }}>
          Manage system-wide configurations and base pricing
        </Text>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <Card
          className="border-0"
          style={{ 
            backgroundColor: theme.inputBackgroundColor || '#FFFFFF', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            borderRadius: '12px',
            maxWidth: '1400px'
          }}
        >
          <div className="mb-6">
            <Title level={4} style={{ color: theme.primaryColor || '#008069', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Message Pricing (ChatCoins)
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Define the default base cost for sending different types of messages. Platform Admins will be charged these amounts per message from their wallet balance unless they have platform-specific overrides.
            </Text>
          </div>
          
          <Divider style={{ margin: '20px 0' }} />

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ textCost: 5, mediaCost: 20, textTranslationCost: 10, voiceCost: 15, voiceTranslationCost: 25 }}
            requiredMark={false}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              <Form.Item
                name="textCost"
                label={
                  <span className="font-semibold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                    <MessageOutlined style={{ color: theme.primaryColor || '#008069' }} /> Text Cost
                  </span>
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} size="large" addonAfter="Coins" style={{ borderRadius: '8px' }} />
              </Form.Item>
              
              <Form.Item
                name="mediaCost"
                label={
                  <span className="font-semibold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                    <PictureOutlined style={{ color: theme.primaryColor || '#008069' }} /> Media Cost
                  </span>
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} size="large" addonAfter="Coins" style={{ borderRadius: '8px' }} />
              </Form.Item>

              <Form.Item
                name="textTranslationCost"
                label={
                  <span className="font-semibold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                    <TranslationOutlined style={{ color: theme.primaryColor || '#008069' }} /> Text Trans.
                  </span>
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} size="large" addonAfter="Coins" style={{ borderRadius: '8px' }} />
              </Form.Item>

              <Form.Item
                name="voiceCost"
                label={
                  <span className="font-semibold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                    <AudioOutlined style={{ color: theme.primaryColor || '#008069' }} /> Voice Cost
                  </span>
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} size="large" addonAfter="Coins" style={{ borderRadius: '8px' }} />
              </Form.Item>

              <Form.Item
                name="voiceTranslationCost"
                label={
                  <span className="font-semibold text-gray-700 flex items-center gap-2 whitespace-nowrap">
                    <CustomerServiceOutlined style={{ color: theme.primaryColor || '#008069' }} /> Voice Trans.
                  </span>
                }
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber className="w-full" min={0} size="large" addonAfter="Coins" style={{ borderRadius: '8px' }} />
              </Form.Item>
            </div>

            <Divider style={{ margin: '20px 0' }} />

            <div className="flex justify-end mt-4">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={updateLoading}
                style={{
                  backgroundColor: theme.primaryColor || '#008069',
                  borderColor: theme.primaryColor || '#008069',
                  borderRadius: '8px',
                  fontWeight: 500,
                  height: '44px',
                  padding: '0 32px'
                }}
              >
                Save Settings
              </Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  );
}
