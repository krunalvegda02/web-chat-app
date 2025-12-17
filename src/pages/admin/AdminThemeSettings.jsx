import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Space,
  Spin,
  Upload,
  Tabs,
  Tag,
  Slider,
  Select,
  Switch,
  message as antMessage,
  Avatar,
} from 'antd';
import {
  BgColorsOutlined,
  UploadOutlined,
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  FontColorsOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';

export default function ThemeCustomization() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth || {});
  const { theme = {}, updating } = useSelector((s) => s.theme || {});

  const [form] = Form.useForm();
  const [changed, setChanged] = useState(false);
  const [previewMode, setPreviewMode] = useState('light');
  const [values, setValues] = useState(theme || {});

  const defaultTheme = {
    appName: 'Chat App',
    logoUrl: null,
    logoHeight: 40,
    primaryColor: '#3B82F6',
    secondaryColor: '#E8F0FE',
    accentColor: '#06B6D4',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    headerBackground: '#F8FAFC',
    headerText: '#1F2937',
    chatBackgroundImage: null,
    chatBubbleAdmin: '#3B82F6',
    chatBubbleUser: '#F3F4F6',
    chatBubbleAdminText: '#FFFFFF',
    chatBubbleUserText: '#1F2937',
    messageFontSize: 14,
    messageBorderRadius: 12,
    bubbleStyle: 'rounded',
    blurEffect: 0.1,
    showAvatars: true,
    showReadStatus: true,
    enableTypingIndicator: true,
  };

  const handleValuesChange = useCallback((_, allValues) => {
    setValues(allValues);
    setChanged(true);
  }, []);

  const handleFinish = useCallback(
    async (formValues) => {
      try {
        antMessage.success('Theme updated successfully');
        setChanged(false);
      } catch (e) {
        antMessage.error('Failed to update theme');
      }
    },
    [dispatch, user]
  );

  const handleReset = useCallback(() => {
    form.setFieldsValue(defaultTheme);
    setValues(defaultTheme);
    setChanged(false);
    antMessage.info('Theme reset to default');
  }, [form]);

  const handleImageUpload = useCallback(
    (fieldName) => ({
      beforeUpload: (file) => {
        const reader = new FileReader();
        reader.onload = () => {
          form.setFieldValue(fieldName, reader.result);
          setChanged(true);
        };
        reader.readAsDataURL(file);
        return false;
      },
      accept: 'image/*',
      maxCount: 1,
      listType: 'picture-card',
    }),
    [form]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-gray-200 flex items-center justify-center">
        <Spin tip="Loading..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-gray-200 p-6">
      {/* Header */}
      <div className="mb-8 p-6 bg-white/95 border border-white/20 rounded-2xl backdrop-blur-lg shadow-xl flex justify-between items-center gap-8 animate-in fade-in slide-in-from-top duration-600">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-3xl shadow-lg">
            <BgColorsOutlined />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Theme Customization
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Customize your chat app branding, colors and message styles.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Spin spinning={!!updating}>
        <Form
          form={form}
          layout="vertical"
          initialValues={Object.keys(theme).length ? theme : defaultTheme}
          onFinish={handleFinish}
          onValuesChange={handleValuesChange}
        >
          {/* Tabs */}
          <div className="mb-8 p-6 bg-white/95 border border-white/20 rounded-2xl backdrop-blur-lg shadow-xl">
            <Tabs
              defaultActiveKey="branding"
              items={[
                {
                  key: 'branding',
                  label: (
                    <span className="flex items-center gap-2">
                      <AppstoreOutlined /> Branding
                    </span>
                  ),
                  children: (
                    <BrandingTab handleImageUpload={handleImageUpload} />
                  ),
                },
                {
                  key: 'colors',
                  label: (
                    <span className="flex items-center gap-2">
                      <BgColorsOutlined /> Colors
                    </span>
                  ),
                  children: <ColorsTab />,
                },
                {
                  key: 'chat',
                  label: (
                    <span className="flex items-center gap-2">
                      <FontColorsOutlined /> Chat Styling
                    </span>
                  ),
                  children: <ChatStylingTab handleImageUpload={handleImageUpload} />,
                },
                {
                  key: 'features',
                  label: (
                    <span className="flex items-center gap-2">
                      <BgColorsOutlined /> Features Preview
                    </span>
                  ),
                  children: <FeaturesTab />,
                },
              ]}
            />
          </div>

          {/* Actions */}
          <div className="mb-8 p-6 bg-white/95 border border-white/20 rounded-2xl backdrop-blur-lg shadow-xl flex justify-between items-center flex-wrap gap-6">
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                htmlType="submit"
                loading={!!updating}
                disabled={!changed}
                size="large"
                className="!bg-gradient-to-r from-blue-500 to-purple-600 !border-none !text-white !font-semibold !h-11 hover:!shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Save Theme
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size="large"
                className="!bg-white/90 !border-blue-200 !text-blue-600 !font-semibold !h-11 hover:!bg-white hover:!shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Reset to Default
              </Button>
            </Space>
            {changed && (
              <Tag color="orange" className="!py-2 !px-4 !font-semibold animate-pulse">
                Unsaved changes
              </Tag>
            )}
          </div>
        </Form>
      </Spin>

      {/* Preview Section */}
      <div className="p-8 bg-white/95 border border-white/20 rounded-2xl backdrop-blur-lg shadow-xl animate-in fade-in slide-in-from-bottom duration-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Live Preview</h2>
        <p className="text-gray-500 text-sm mb-6 italic">
          This is how your chat UI will look with the current settings.
        </p>
        <PreviewChat theme={{ ...defaultTheme, ...values }} mode={previewMode} />
      </div>
    </div>
  );
}

/* ---------- Branding Tab ---------- */

function BrandingTab({ handleImageUpload }) {
  return (
    <div className="pt-6 animate-in fade-in duration-300">
      <div className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b-2 border-blue-200">
        Brand Identity
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="appName"
            label={<span className="font-semibold text-gray-800 text-sm">Application Name</span>}
            rules={[
              { required: true, message: 'App name is required' },
              { max: 50, message: 'Max 50 characters' },
            ]}
          >
            <Input
              placeholder="My Chat App"
              prefix={<AppstoreOutlined />}
              className="!bg-gradient-to-br from-white to-blue-50 !border-blue-200 !rounded-lg hover:!border-blue-400 focus:!border-blue-500 focus:!shadow-lg transition-all duration-300"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="logoHeight"
            label={<span className="font-semibold text-gray-800 text-sm">Logo Height (px)</span>}
          >
            <Slider min={30} max={80} step={5} className="mt-4" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            name="logoUrl"
            label={<span className="font-semibold text-gray-800 text-sm">Logo Image</span>}
          >
            <Upload
              {...handleImageUpload('logoUrl')}
              className="!bg-gradient-to-br from-white to-blue-50 !border-2 !border-dashed !border-blue-300 !rounded-lg hover:!border-blue-500 transition-all duration-300"
            >
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <UploadOutlined className="text-3xl text-blue-600 mb-2" />
                <p className="font-semibold text-sm">Upload Logo</p>
              </div>
            </Upload>
          </Form.Item>
          <p className="text-xs text-gray-500 mt-2 italic">
            Recommended: ~200x60px, PNG or SVG.
          </p>
        </Col>
      </Row>
    </div>
  );
}

/* ---------- Colors Tab ---------- */

function ColorsTab() {
  const list = [
    {
      name: 'primaryColor',
      label: 'Primary Color',
      desc: 'Main brand color for buttons and highlights',
    },
    {
      name: 'secondaryColor',
      label: 'Secondary Color',
      desc: 'Light backgrounds and subtle surfaces',
    },
    {
      name: 'accentColor',
      label: 'Accent Color',
      desc: 'Badges, chips and small highlights',
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      desc: 'Overall chat background',
    },
    {
      name: 'borderColor',
      label: 'Border Color',
      desc: 'Dividers and chat borders',
    },
    {
      name: 'headerBackground',
      label: 'Header Background',
      desc: 'Top bar background',
    },
    {
      name: 'headerText',
      label: 'Header Text Color',
      desc: 'Text color in header bar',
    },
  ];

  return (
    <div className="pt-6 animate-in fade-in duration-300">
      <div className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b-2 border-blue-200">
        Color Scheme
      </div>
      <Row gutter={[24, 24]} className="mb-8">
        {list.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.name}>
            <Form.Item
              name={item.name}
              label={<span className="font-semibold text-gray-800 text-sm">{item.label}</span>}
            >
              <Input
                type="color"
                className="!w-20 !h-12 !border-2 !border-blue-200 !rounded-lg !p-0 !bg-white hover:!border-blue-400 cursor-pointer transition-all duration-300"
              />
            </Form.Item>
            <p className="text-xs text-gray-500 italic">{item.desc}</p>
          </Col>
        ))}
      </Row>
      <ColorPalettePreview />
    </div>
  );
}

/* ---------- Chat Styling Tab ---------- */

function ChatStylingTab({ handleImageUpload }) {
  return (
    <div className="pt-6 animate-in fade-in duration-300">
      <div className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b-2 border-blue-200">
        Chat Message Styling
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12}>
          <Form.Item
            name="bubbleStyle"
            label={<span className="font-semibold text-gray-800 text-sm">Bubble Style</span>}
          >
            <Select
              options={[
                { label: 'Rounded', value: 'rounded' },
                { label: 'Square', value: 'square' },
                { label: 'Pill', value: 'pill' },
              ]}
              className="!bg-gradient-to-br from-white to-blue-50"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            name="messageBorderRadius"
            label={<span className="font-semibold text-gray-800 text-sm">Bubble Corner Radius</span>}
          >
            <Slider min={0} max={30} step={2} className="mt-4" />
          </Form.Item>
        </Col>

        {/* Color Pickers */}
        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="chatBubbleAdmin"
            label={<span className="font-semibold text-gray-800 text-sm">Admin Bubble Color</span>}
          >
            <Input
              type="color"
              className="!w-20 !h-12 !border-2 !border-blue-200 !rounded-lg !p-0 !bg-white hover:!border-blue-400 cursor-pointer transition-all duration-300"
            />
          </Form.Item>
          <p className="text-xs text-gray-500 italic">Color for your (admin) messages.</p>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="chatBubbleAdminText"
            label={<span className="font-semibold text-gray-800 text-sm">Admin Text Color</span>}
          >
            <Input
              type="color"
              className="!w-20 !h-12 !border-2 !border-blue-200 !rounded-lg !p-0 !bg-white hover:!border-blue-400 cursor-pointer transition-all duration-300"
            />
          </Form.Item>
          <p className="text-xs text-gray-500 italic">Text color inside admin bubbles.</p>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="chatBubbleUser"
            label={<span className="font-semibold text-gray-800 text-sm">User Bubble Color</span>}
          >
            <Input
              type="color"
              className="!w-20 !h-12 !border-2 !border-blue-200 !rounded-lg !p-0 !bg-white hover:!border-blue-400 cursor-pointer transition-all duration-300"
            />
          </Form.Item>
          <p className="text-xs text-gray-500 italic">Color for user messages.</p>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Form.Item
            name="chatBubbleUserText"
            label={<span className="font-semibold text-gray-800 text-sm">User Text Color</span>}
          >
            <Input
              type="color"
              className="!w-20 !h-12 !border-2 !border-blue-200 !rounded-lg !p-0 !bg-white hover:!border-blue-400 cursor-pointer transition-all duration-300"
            />
          </Form.Item>
          <p className="text-xs text-gray-500 italic">Text color inside user bubbles.</p>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item
            name="messageFontSize"
            label={<span className="font-semibold text-gray-800 text-sm">Message Font Size (px)</span>}
          >
            <Slider min={12} max={18} step={1} className="mt-4" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="chatBackgroundImage"
            label={<span className="font-semibold text-gray-800 text-sm">Chat Background Image</span>}
          >
            <Upload
              {...handleImageUpload('chatBackgroundImage')}
              maxCount={1}
              listType="picture-card"
              className="!bg-gradient-to-br from-white to-blue-50 !border-2 !border-dashed !border-blue-300 !rounded-lg hover:!border-blue-500 transition-all duration-300"
            >
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <UploadOutlined className="text-3xl text-blue-600 mb-2" />
                <p className="font-semibold text-sm">Upload Background</p>
              </div>
            </Upload>
          </Form.Item>
          <p className="text-xs text-gray-500 mt-2 italic">
            Recommended: 1920x1080 JPG or PNG, subtle and light.
          </p>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="blurEffect"
            label={<span className="font-semibold text-gray-800 text-sm">Background Overlay Strength</span>}
          >
            <Slider min={0} max={1} step={0.1} className="mt-4" />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}

/* ---------- Features Tab ---------- */

function FeaturesTab() {
  const features = [
    {
      name: 'showAvatars',
      title: 'Show User Avatars',
      desc: 'Display profile pictures next to messages.',
    },
    {
      name: 'showReadStatus',
      title: 'Show Read Status',
      desc: 'Show ticks / labels when a message is read.',
    },
    {
      name: 'enableTypingIndicator',
      title: 'Typing Indicator',
      desc: 'Show animated "typing…" indicator.',
    },
  ];

  return (
    <div className="pt-6 animate-in fade-in duration-300">
      
      <div className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b-2 border-blue-200">
        Chat Features
      </div>
      <Row gutter={[24, 24]}>
        {features.map((f) => (
          <Col xs={24} key={f.name}>
            <div className="flex items-center gap-6 p-4 bg-gradient-to-br from-white to-blue-50 border border-white/30 rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
              <Form.Item
                name={f.name}
                valuePropName="checked"
                className="!m-0"
              >
                <Switch />
              </Form.Item>
              <div>
                <div className="font-semibold text-gray-800">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}

/* ---------- Color Palette Preview ---------- */

function ColorPalettePreview() {
  const colors = [
    { hex: '#3B82F6', label: 'Primary' },
    { hex: '#E8F0FE', label: 'Secondary' },
    { hex: '#06B6D4', label: 'Accent' },
    { hex: '#F3F4F6', label: 'Background' },
  ];

  return (
    <div className="mt-8 p-6 bg-gradient-to-br from-white/80 to-blue-50/70 border border-white/20 rounded-2xl shadow-lg">
      <div className="text-base font-semibold text-gray-800 mb-6">
        Color Palette Preview
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {colors.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-16 rounded-lg border-2 border-white/50 shadow-md hover:scale-110 hover:shadow-lg transition-all duration-300 cursor-pointer"
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-sm font-semibold text-gray-600">{c.label}</span>
            <span className="text-xs font-mono text-gray-400">{c.hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Typing Indicator Component ---------- */

function TypingBubble({ theme }) {
  return (
    <div
      className="px-4 py-3 flex items-center gap-2 shadow-sm"
      style={{
        backgroundColor: theme.chatBubbleAdmin,
        color: theme.chatBubbleAdminText,
        borderRadius: theme.messageBorderRadius || 15,
        width: 'fit-content',
      }}
    >
      {/* <span className="text-sm font-medium">typing</span> */}
      <span className="inline-flex gap-1.5 ml-1">
        <span
          className="inline-block w-2 h-2 rounded-full bg-current animate-bounce"
          style={{ animationDelay: '0ms' }}
        ></span>
        <span
          className="inline-block w-2 h-2 rounded-full bg-current animate-bounce"
          style={{ animationDelay: '150ms' }}
        ></span>
        <span
          className="inline-block w-2 h-2 rounded-full bg-current animate-bounce"
          style={{ animationDelay: '300ms' }}
        ></span>
      </span>
    </div>
  );
}

/* ---------- Live Preview Chat ---------- */

function PreviewChat({ theme }) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border-2 h-96 shadow-lg"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 px-4 py-3 border-b font-semibold text-base flex-shrink-0"
        style={{
          backgroundColor: theme.headerBackground,
          color: theme.headerText,
          borderColor: theme.borderColor,
        }}
      >
        {theme.logoUrl && (
          <img
            src={theme.logoUrl}
            alt="Logo"
            className="object-contain"
            style={{ height: theme.logoHeight || 40 }}
          />
        )}
        <span className="font-semibold text-base">{theme.appName || 'Chat App'}</span>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto p-6 relative flex flex-col gap-4"
        style={{
          backgroundImage: theme.chatBackgroundImage ? `url(${theme.chatBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 bg-white/50 pointer-events-none"
          style={{ opacity: theme.blurEffect || 0.1 }}
        />
        <div className="relative z-10 flex flex-col gap-4">
          {/* Admin Message with Avatar and Read Status */}
          <div className="flex items-end justify-start gap-2 animate-in fade-in slide-in-from-bottom duration-500">
            {theme.showAvatars && (
              <Avatar
                style={{ backgroundColor: theme.chatBubbleAdmin }}
                size="small"
              >
                A
              </Avatar>
            )}
            <div
              className="px-6 py-3 max-w-xs break-words shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative"
              style={{
                backgroundColor: theme.chatBubbleAdmin,
                color: theme.chatBubbleAdminText,
                borderRadius: theme.messageBorderRadius || 12,
                fontSize: theme.messageFontSize || 14,
              }}
            >
              Hello! How can I help you today?
              {theme.showReadStatus && (
                <span className="ml-2 text-xs inline-block" style={{ opacity: 0.8 }}>
                  ✓✓
                </span>
              )}
            </div>
          </div>

          {/* User Message with Avatar and Read Status */}
          <div className="flex items-end justify-end gap-2 animate-in fade-in slide-in-from-bottom duration-700">
            <div
              className="px-6 py-3 max-w-xs break-words shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative"
              style={{
                backgroundColor: theme.chatBubbleUser,
                color: theme.chatBubbleUserText,
                borderRadius: theme.messageBorderRadius || 12,
                fontSize: theme.messageFontSize || 14,
              }}
            >
              I need help with my account.
              {theme.showReadStatus && (
                <span className="ml-2 text-xs inline-block" style={{ opacity: 0.7 }}>
                  ✓
                </span>
              )}
            </div>
            {theme.showAvatars && (
              <Avatar
                style={{ backgroundColor: theme.primaryColor }}
                size="small"
              >
                U
              </Avatar>
            )}
          </div>

          {/* Typing Indicator */}
          {theme.enableTypingIndicator && (
            <div className="flex items-end justify-start gap-2 animate-in fade-in slide-in-from-bottom duration-1000">
              {theme.showAvatars && (
                <Avatar
                  style={{ backgroundColor: theme.chatBubbleAdmin }}
                  size="small"
                >
                  A
                </Avatar>
              )}
              <TypingBubble theme={theme} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div
        className="flex items-center gap-2 p-4 border-t"
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
        }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 transition-all duration-300"
          style={{
            backgroundColor: theme.secondaryColor,
            borderColor: theme.borderColor,
            color: theme.headerText,
          }}
          disabled
        />
        <button
          className="px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 flex items-center gap-2"
          style={{
            backgroundColor: theme.primaryColor,
            color: theme.chatBubbleAdminText,
          }}
          disabled
        >
          Send
        </button>
      </div>
    </div>
  );
}
