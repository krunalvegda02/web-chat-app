import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenantTheme, updateTenantTheme, uploadThemeImage } from '../../redux/slices/themeSlice';
import {
  Form, Input, Button, Row, Col, Spin, Upload, Tabs, Slider, message as antMessage, Avatar, Card, Badge,
} from 'antd';
import {
  BgColorsOutlined, UploadOutlined, SaveOutlined, ReloadOutlined, AppstoreOutlined,
  PictureOutlined, MessageOutlined, WarningOutlined, BulbOutlined, UserOutlined,
  CheckOutlined, EditOutlined, SettingOutlined, SearchOutlined, SendOutlined,
} from '@ant-design/icons';

export default function ThemeCustomization() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { theme = {}, updating, uploading } = useSelector((s) => s.theme || {});
  const [form] = Form.useForm();
  const [changed, setChanged] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const formValues = Form.useWatch([], form);

  const defaultTheme = {
    appName: 'Chat App',
    logoUrl: null,
    logoHeight: 40,
    primaryColor: '#008069',
    secondaryColor: '#F0F2F5',
    sidebarBackgroundColor: '#FFFFFF',
    sidebarHeaderColor: '#008069',
    sidebarTextColor: '#111B21',
    sidebarHoverColor: '#F5F6F6',
    sidebarActiveColor: '#F0F2F5',
    sidebarBorderColor: '#E9EDEF',
    headerBackgroundColor: '#008069',
    headerTextColor: '#FFFFFF',
    headerIconColor: '#FFFFFF',
    chatBackgroundColor: '#E5DDD5',
    senderBubbleColor: '#DCF8C6',
    senderTextColor: '#111B21',
    senderBubbleRadius: 8,
    receiverBubbleColor: '#FFFFFF',
    receiverTextColor: '#111B21',
    receiverBubbleRadius: 8,
    inputBackgroundColor: '#F0F2F5',
    inputTextColor: '#111B21',
    sendButtonColor: '#008069',
    sendButtonIconColor: '#FFFFFF',
    unreadBadgeColor: '#25D366',
    avatarBackgroundColor: '#00A884',
    avatarTextColor: '#FFFFFF',
    timestampColor: '#667781',
  };

  useEffect(() => {
    if (user?.tenantId) dispatch(fetchTenantTheme(user.tenantId));
  }, [dispatch, user?.tenantId]);

  useEffect(() => {
    if (theme && Object.keys(theme).length > 0) form.setFieldsValue(theme);
  }, [theme, form]);

  const handleFinish = useCallback(async (formValues) => {
    if (!user?.tenantId) return antMessage.error('Tenant ID not found');
    setSaving(true);
    try {
      let finalValues = { ...formValues };
      if (logoFile) {
        const logoResult = await dispatch(uploadThemeImage({ file: logoFile, type: 'logo', oldUrl: theme.logoUrl })).unwrap();
        finalValues.logoUrl = logoResult.url;
      }
      if (bgFile) {
        const bgResult = await dispatch(uploadThemeImage({ file: bgFile, type: 'background', oldUrl: theme.chatBackgroundImage })).unwrap();
        finalValues.chatBackgroundImage = bgResult.url;
      }
      await dispatch(updateTenantTheme({ tenantId: user.tenantId, ...finalValues })).unwrap();
      antMessage.success('✅ Theme updated successfully');
      setChanged(false);
      setLogoFile(null);
      setBgFile(null);
    } catch (e) {
      antMessage.error(e || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  }, [dispatch, user, logoFile, bgFile, theme]);

  const handleReset = useCallback(async () => {
    if (!user?.tenantId) return antMessage.error('Tenant ID not found');
    setSaving(true);
    try {
      await dispatch(updateTenantTheme({ tenantId: user.tenantId, ...defaultTheme })).unwrap();
      form.setFieldsValue(defaultTheme);
      setChanged(false);
      setLogoFile(null);
      setBgFile(null);
      antMessage.success('✅ Theme reset to default successfully');
    } catch (e) {
      antMessage.error(e || 'Failed to reset theme');
    } finally {
      setSaving(false);
    }
  }, [dispatch, user, form]);

  const handleImageUpload = useCallback((fieldName) => ({
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        form.setFieldValue(fieldName, reader.result);
        if (fieldName === 'logoUrl') setLogoFile(file);
        else if (fieldName === 'chatBackgroundImage') setBgFile(file);
        setChanged(true);
      };
      reader.readAsDataURL(file);
      return false;
    },
    accept: 'image/*',
    maxCount: 1,
    listType: 'picture-card',
  }), [form]);

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;

  const currentTheme = { ...defaultTheme, ...formValues };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-3 sm:p-4 md:p-6">
      <div className="mb-5">
        <Card className="border-0 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border border-blue-200">
                <BgColorsOutlined style={{ fontSize: '20px', color: '#3B82F6' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Theme Customization</h1>
                <p className="text-sm text-gray-600">Customize your chat app branding & colors</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button icon={<ReloadOutlined />} onClick={handleReset} loading={saving}>Reset</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} loading={saving || uploading || updating} disabled={!changed}>Save</Button>
            </div>
          </div>
        </Card>
      </div>

      {changed && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <WarningOutlined className="text-xl text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">Unsaved Changes</p>
            <p className="text-sm text-amber-700">Click Save to apply your changes.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div>
          <Spin spinning={updating}>
            <Form form={form} layout="vertical" onFinish={handleFinish} onValuesChange={() => setChanged(true)}>
              <Card className="border-0 shadow-lg">
                <Tabs items={[
                  { key: 'branding', label: <span><AppstoreOutlined /> Branding</span>, children: <BrandingTab handleImageUpload={handleImageUpload} theme={theme} /> },
                  { key: 'sidebar', label: <span><AppstoreOutlined /> Sidebar</span>, children: <SidebarTab /> },
                  { key: 'header', label: <span><SettingOutlined /> Header</span>, children: <HeaderTab /> },
                  { key: 'bubbles', label: <span><MessageOutlined /> Bubbles</span>, children: <BubblesTab /> },
                  { key: 'input', label: <span><EditOutlined /> Input</span>, children: <InputTab /> },
                  { key: 'misc', label: <span><BgColorsOutlined /> Misc</span>, children: <MiscTab handleImageUpload={handleImageUpload} /> },
                ]} />
              </Card>
            </Form>
          </Spin>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-6 h-fit">
          <Card className="border-0 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MessageOutlined className="text-blue-600" />
              Live Preview
            </h2>
            <div className="overflow-x-auto">
              <WhatsAppPreview theme={currentTheme} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BrandingTab({ handleImageUpload, theme }) {
  return (
    <div className="space-y-4">
      <Card className="bg-blue-50">
        <h4 className="font-semibold mb-3">Primary & Secondary Colors</h4>
        <p className="text-xs text-gray-600 mb-3">These colors will be used as fallback when specific theme values are not set</p>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Primary Color" name="primaryColor" initialValue="#008069">
              <Input type="color" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Secondary Color" name="secondaryColor" initialValue="#F0F2F5">
              <Input type="color" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
      <Form.Item label="Application Name" name="appName">
        <Input placeholder="My Chat App" prefix={<AppstoreOutlined />} />
      </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Upload Logo" name="logoUrl">
            <Upload {...handleImageUpload('logoUrl')}>
              <div className="flex flex-col items-center gap-2">
                <UploadOutlined className="text-2xl" />
                <span className="text-sm">Upload</span>
              </div>
            </Upload>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Logo Height (px)" name="logoHeight" initialValue={40}>
            <Slider min={20} max={80} step={5} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

function SidebarTab() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={12}><Form.Item label="Background" name="sidebarBackgroundColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Header" name="sidebarHeaderColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Text" name="sidebarTextColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Hover" name="sidebarHoverColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Active" name="sidebarActiveColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Border" name="sidebarBorderColor"><Input type="color" /></Form.Item></Col>
    </Row>
  );
}

function HeaderTab() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={12}><Form.Item label="Background" name="headerBackgroundColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Text" name="headerTextColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Icon" name="headerIconColor"><Input type="color" /></Form.Item></Col>
    </Row>
  );
}

function BubblesTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-green-50">
        <h4 className="font-semibold mb-3">Sender (Your Messages)</h4>
        <Row gutter={[16, 16]}>
          <Col span={12}><Form.Item label="Bubble Color" name="senderBubbleColor"><Input type="color" /></Form.Item></Col>
          <Col span={12}><Form.Item label="Text Color" name="senderTextColor"><Input type="color" /></Form.Item></Col>
          <Col span={24}><Form.Item label="Border Radius" name="senderBubbleRadius" initialValue={8}><Slider min={0} max={20} /></Form.Item></Col>
        </Row>
      </Card>
      <Card className="bg-gray-50">
        <h4 className="font-semibold mb-3">Receiver (Other's Messages)</h4>
        <Row gutter={[16, 16]}>
          <Col span={12}><Form.Item label="Bubble Color" name="receiverBubbleColor"><Input type="color" /></Form.Item></Col>
          <Col span={12}><Form.Item label="Text Color" name="receiverTextColor"><Input type="color" /></Form.Item></Col>
          <Col span={24}><Form.Item label="Border Radius" name="receiverBubbleRadius" initialValue={8}><Slider min={0} max={20} /></Form.Item></Col>
        </Row>
      </Card>
    </div>
  );
}

function InputTab() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={12}><Form.Item label="Background" name="inputBackgroundColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Text" name="inputTextColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Send Button" name="sendButtonColor"><Input type="color" /></Form.Item></Col>
      <Col span={12}><Form.Item label="Send Icon" name="sendButtonIconColor"><Input type="color" /></Form.Item></Col>
    </Row>
  );
}

function MiscTab({ handleImageUpload }) {
  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col span={12}><Form.Item label="Chat Background Color" name="chatBackgroundColor"><Input type="color" /></Form.Item></Col>
        <Col span={12}><Form.Item label="Badge Color" name="unreadBadgeColor"><Input type="color" /></Form.Item></Col>
        <Col span={12}><Form.Item label="Avatar Background" name="avatarBackgroundColor"><Input type="color" /></Form.Item></Col>
        <Col span={12}><Form.Item label="Avatar Text" name="avatarTextColor"><Input type="color" /></Form.Item></Col>
        <Col span={12}><Form.Item label="Timestamp" name="timestampColor"><Input type="color" /></Form.Item></Col>
      </Row>
      <Card className="bg-purple-50">
        <h4 className="font-semibold mb-3">Chat Background Image</h4>
        <Form.Item label="Upload Background Image" name="chatBackgroundImage">
          <Upload {...handleImageUpload('chatBackgroundImage')}>
            <div className="flex flex-col items-center gap-2">
              <PictureOutlined className="text-2xl" />
              <span className="text-sm">Upload Image</span>
            </div>
          </Upload>
        </Form.Item>
        <p className="text-xs text-gray-600"><BulbOutlined className="text-amber-500" /> Recommended: 1920x1080 JPG/PNG</p>
      </Card>
    </div>
  );
}

function WhatsAppPreview({ theme }) {
  return (
    <div className="flex border rounded-lg overflow-hidden" style={{ minWidth: '800px', height: '600px', backgroundColor: theme.sidebarBackgroundColor }}>
      {/* Sidebar */}
      <div className="w-80 flex flex-col border-r" style={{ borderColor: theme.sidebarBorderColor }}>
        <div className="px-4 py-5 flex items-center justify-between" style={{ backgroundColor: theme.sidebarHeaderColor }}>
          <h3 className="font-medium" style={{ color: theme.headerTextColor }}>{theme.appName || 'Chat App'}</h3>
          <SearchOutlined style={{ color: theme.headerIconColor }} />
        </div>
        <div className="px-3 py-2" style={{ backgroundColor: theme.sidebarBackgroundColor }}>
          <Input placeholder="Search" prefix={<SearchOutlined />} style={{ backgroundColor: theme.inputBackgroundColor, border: 'none' }} />
        </div>
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: theme.sidebarBackgroundColor }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b cursor-pointer" style={{ borderColor: theme.sidebarBorderColor, backgroundColor: i === 1 ? theme.sidebarActiveColor : 'transparent' }}>
              <Avatar size={50} style={{ backgroundColor: theme.avatarBackgroundColor, color: theme.avatarTextColor }}>U</Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <p className="font-medium truncate" style={{ color: theme.sidebarTextColor }}>User {i}</p>
                  <span className="text-xs" style={{ color: theme.timestampColor }}>12:30 PM</span>
                </div>
                <p className="text-sm truncate" style={{ color: theme.timestampColor }}>Last message preview...</p>
              </div>
              {i === 2 && <Badge count={3} style={{ backgroundColor: theme.unreadBadgeColor }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ backgroundColor: theme.headerBackgroundColor, borderColor: theme.sidebarBorderColor }}>
          <Avatar size={40} style={{ backgroundColor: theme.avatarBackgroundColor, color: theme.avatarTextColor }}>U</Avatar>
          <div>
            <p className="font-medium" style={{ color: theme.headerTextColor }}>User 1</p>
            <p className="text-xs" style={{ color: theme.headerIconColor, opacity: 0.8 }}>online</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 relative" style={{ backgroundColor: theme.chatBackgroundColor, backgroundImage: theme.chatBackgroundImage ? `url(${theme.chatBackgroundImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="flex flex-col gap-3">
            <div className="flex justify-start">
              <div className="px-3 py-2 max-w-xs shadow-sm" style={{ backgroundColor: theme.receiverBubbleColor, color: theme.receiverTextColor, borderRadius: `${theme.receiverBubbleRadius}px` }}>
                <p className="text-sm">Hello! How can I help you?</p>
                <span className="text-xs block text-right mt-1" style={{ color: theme.timestampColor }}>12:30 PM</span>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="px-3 py-2 max-w-xs shadow-sm" style={{ backgroundColor: theme.senderBubbleColor, color: theme.senderTextColor, borderRadius: `${theme.senderBubbleRadius}px` }}>
                <p className="text-sm">I need help with my account</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs" style={{ color: theme.timestampColor }}>12:31 PM</span>
                  <CheckOutlined className="text-xs" style={{ color: theme.timestampColor }} />
                </div>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="px-3 py-2 max-w-xs shadow-sm" style={{ backgroundColor: theme.receiverBubbleColor, color: theme.receiverTextColor, borderRadius: `${theme.receiverBubbleRadius}px` }}>
                <p className="text-sm">Sure, I'd be happy to assist you with that.</p>
                <span className="text-xs block text-right mt-1" style={{ color: theme.timestampColor }}>12:31 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center gap-2 border-t" style={{ backgroundColor: theme.sidebarBackgroundColor, borderColor: theme.sidebarBorderColor }}>
          <input type="text" placeholder="Type a message" className="flex-1 px-3 py-2 rounded-lg outline-none" style={{ backgroundColor: theme.inputBackgroundColor, color: theme.inputTextColor }} disabled />
          <button className="p-2 rounded-full" style={{ backgroundColor: theme.sendButtonColor }}>
            <SendOutlined style={{ color: theme.sendButtonIconColor }} />
          </button>
        </div>
      </div>
    </div>
  );
}
