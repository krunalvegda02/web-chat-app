
import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenantTheme, updateTenantTheme, uploadThemeImage } from '../../redux/slices/themeSlice';
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
  Card,
  Divider,
} from 'antd';
import {
  BgColorsOutlined,
  UploadOutlined,
  SaveOutlined,
  ReloadOutlined,
  FontColorsOutlined,
  AppstoreOutlined,
  PictureOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BulbOutlined,
  UserOutlined,
  CheckOutlined,
  EditOutlined,
  FileImageOutlined,
  SettingOutlined,
  EyeOutlined,
  BorderOutlined,
  HighlightOutlined,
  FileTextOutlined,
  RobotOutlined,
  TeamOutlined,
  LoadingOutlined,
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
  const previewMode = 'light';

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

  const handleValuesChange = useCallback(() => {
    setChanged(true);
  }, []);

  useEffect(() => {
    if (user?.tenantId) {
      dispatch(fetchTenantTheme(user.tenantId));
    }
  }, [dispatch, user?.tenantId]);

  useEffect(() => {
    if (theme && Object.keys(theme).length > 0) {
      form.setFieldsValue(theme);
    }
  }, [theme, form]);

  const handleFinish = useCallback(
    async (formValues) => {
      if (!user?.tenantId) {
        antMessage.error('Tenant ID not found');
        return;
      }
      setSaving(true);
      try {
        let finalValues = { ...formValues };

        if (logoFile) {
          const logoResult = await dispatch(
            uploadThemeImage({
              file: logoFile,
              type: 'logo',
              oldUrl: theme.logoUrl,
            })
          ).unwrap();
          finalValues.logoUrl = logoResult.url;
        }

        if (bgFile) {
          const bgResult = await dispatch(
            uploadThemeImage({
              file: bgFile,
              type: 'background',
              oldUrl: theme.chatBackgroundImage,
            })
          ).unwrap();
          finalValues.chatBackgroundImage = bgResult.url;
        }

        await dispatch(
          updateTenantTheme({ tenantId: user.tenantId, ...finalValues })
        ).unwrap();

        antMessage.success('✅ Theme updated successfully');
        setChanged(false);
        setLogoFile(null);
        setBgFile(null);
      } catch (e) {
        antMessage.error(e || 'Failed to update theme');
      } finally {
        setSaving(false);
      }
    },
    [dispatch, user, logoFile, bgFile, theme]
  );

  const handleReset = useCallback(() => {
    form.setFieldsValue(defaultTheme);
    setChanged(false);
    setLogoFile(null);
    setBgFile(null);
    antMessage.info('Theme reset to default');
  }, [form]);

  const handleImageUpload = useCallback(
    (fieldName) => ({
      beforeUpload: (file) => {
        const reader = new FileReader();
        reader.onload = () => {
          form.setFieldValue(fieldName, reader.result);
          if (fieldName === 'logoUrl') {
            setLogoFile(file);
          } else if (fieldName === 'chatBackgroundImage') {
            setBgFile(file);
          }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 flex items-center justify-center">
        <Spin size="large" tip="Loading theme settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-3 sm:p-4 md:p-6">
      {/* Professional Header */}
      <div className="mb-5 sm:mb-6">
        <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-2.5 sm:p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border border-blue-200 shadow-sm flex-shrink-0">
                <BgColorsOutlined style={{ fontSize: '20px', color: '#3B82F6' }} />
              </div>
              <div className="flex-1">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Theme Customization
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                  Customize your chat app branding & colors
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={!changed}
                className="flex-1 sm:flex-none h-9 sm:h-10 font-semibold text-xs sm:text-sm"
              >
                Reset
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => form.submit()}
                loading={saving || uploading || updating}
                disabled={!changed}
                className="flex-1 sm:flex-none h-9 sm:h-10 font-semibold text-xs sm:text-sm bg-blue-600 border-0 hover:bg-blue-700"
              >
                Save
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Indicator */}
      {changed && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg flex items-start sm:items-center gap-3 shadow-sm">
          <WarningOutlined className="text-lg sm:text-xl text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm sm:text-base">Unsaved Changes</p>
            <p className="text-xs sm:text-sm text-amber-700">Click Save to apply your changes.</p>
          </div>
        </div>
      )}

      {/* Form Content */}
      <Spin spinning={updating} tip="Updating theme...">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onValuesChange={handleValuesChange}
        >
          <Card className="border-0 shadow-lg">
            <Tabs
              defaultActiveKey="branding"
              items={[
                {
                  key: 'branding',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <AppstoreOutlined style={{ color: '#8B5CF6' }} />
                      <span className="hidden sm:inline">Branding</span>
                      <span className="sm:hidden">Brand</span>
                    </span>
                  ),
                  children: <BrandingTab handleImageUpload={handleImageUpload} theme={theme} />,
                },
                {
                  key: 'colors',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <BgColorsOutlined style={{ color: '#3B82F6' }} />
                      <span className="hidden sm:inline">Colors</span>
                      <span className="sm:hidden">Color</span>
                    </span>
                  ),
                  children: <ColorsTab />,
                },
                {
                  key: 'chat',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <FontColorsOutlined style={{ color: '#10B981' }} />
                      <span className="hidden sm:inline">Chat Styling</span>
                      <span className="sm:hidden">Chat</span>
                    </span>
                  ),
                  children: <ChatStylingTab handleImageUpload={handleImageUpload} />,
                },
                {
                  key: 'features',
                  label: (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <MessageOutlined style={{ color: '#F59E0B' }} />
                      <span className="hidden sm:inline">Features</span>
                      <span className="sm:hidden">Feat</span>
                    </span>
                  ),
                  children: <FeaturesTab />,
                },
              ]}
            />
          </Card>
        </Form>
      </Spin>

      {/* Preview Section */}
      <div className="mt-5 sm:mt-6">
        <Card className="border-0 shadow-lg">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg">
                <MessageOutlined className="text-blue-600" style={{ fontSize: '16px' }} />
              </div>
              Live Preview
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5">
              See how your chat UI will look with these settings
            </p>
          </div>
          <PreviewChat theme={{ ...defaultTheme, ...theme }} mode={previewMode} />
        </Card>
      </div>
    </div>
  );
}

/* ========== BRANDING TAB ========== */

function BrandingTab({ handleImageUpload, theme }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-25 shadow-none border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <AppstoreOutlined className="text-blue-600" />
          </div>
          Application Identity
        </h3>

        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Application Name</span>}
          name="appName"
          rules={[
            { required: true, message: 'App name is required' },
            { max: 50, message: 'Maximum 50 characters' },
          ]}
        >
          <Input
            placeholder="My Chat App"
            size="large"
            className="rounded-lg text-sm"
            prefix={<AppstoreOutlined className="text-gray-400" />}
          />
        </Form.Item>
      </Card>

      <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-25 shadow-none border border-purple-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <PictureOutlined className="text-purple-600" />
          </div>
          Logo Settings
        </h3>

        <Row gutter={[12, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Upload Logo</span>}
              name="logoUrl"
            >
              <Upload
                {...handleImageUpload('logoUrl')}
                listType="picture-card"
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <UploadOutlined className="text-xl sm:text-2xl text-purple-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Upload</span>
                </div>
              </Upload>
            </Form.Item>
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <BulbOutlined className="text-amber-500" /> ~200x60px, PNG/SVG
            </p>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Logo Height (px)</span>}
              name="logoHeight"
              initialValue={40}
            >
              <Slider
                min={20}
                max={80}
                step={5}
                marks={{ 20: '20', 40: '40', 60: '60', 80: '80' }}
                tooltip={{ formatter: (value) => `${value}px` }}
              />
            </Form.Item>
          </Col>
        </Row>

        {theme.logoUrl && (
          <div className="mt-4 p-3 sm:p-4 bg-white border border-purple-200 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2">Preview:</p>
            <img
              src={theme.logoUrl}
              alt="Logo"
              style={{ height: `${theme.logoHeight || 40}px` }}
              className="max-w-full h-auto"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

/* ========== COLORS TAB ========== */

function ColorsTab() {
  const primaryColors = [
    { name: 'primaryColor', label: 'Primary', desc: 'Main brand color', bg: 'from-blue-50 to-blue-25', border: 'border-blue-100', icon: <BgColorsOutlined className="text-blue-600" /> },
    { name: 'secondaryColor', label: 'Secondary', desc: 'Light backgrounds', bg: 'from-cyan-50 to-cyan-25', border: 'border-cyan-100', icon: <HighlightOutlined className="text-cyan-600" /> },
    { name: 'accentColor', label: 'Accent', desc: 'Badges & highlights', bg: 'from-teal-50 to-teal-25', border: 'border-teal-100', icon: <CheckCircleOutlined className="text-teal-600" /> },
  ];

  const backgroundColors = [
    { name: 'backgroundColor', label: 'Background', desc: 'Chat background', bg: 'from-gray-50 to-gray-25', border: 'border-gray-100', icon: <FileTextOutlined className="text-gray-600" /> },
    { name: 'borderColor', label: 'Border', desc: 'Dividers', bg: 'from-slate-50 to-slate-25', border: 'border-slate-100', icon: <BorderOutlined className="text-slate-600" /> },
    { name: 'headerBackground', label: 'Header BG', desc: 'Top bar', bg: 'from-indigo-50 to-indigo-25', border: 'border-indigo-100', icon: <AppstoreOutlined className="text-indigo-600" /> },
    { name: 'headerText', label: 'Header Text', desc: 'Header text color', bg: 'from-gray-100 to-gray-50', border: 'border-gray-200', icon: <FontColorsOutlined className="text-gray-700" /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Primary Colors */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-25 shadow-none border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <BgColorsOutlined className="text-lg text-blue-600" />
          Primary Colors
        </h3>

        <Row gutter={[12, 16]}>
          {primaryColors.map((item) => (
            <Col xs={24} sm={12} lg={8} key={item.name}>
              <Card className={`border-0 bg-gradient-to-br ${item.bg} shadow-none border ${item.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{item.label}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                </div>
                <Form.Item name={item.name} className="mb-0">
                  <Input
                    type="color"
                    className="h-10 sm:h-12 rounded-lg cursor-pointer border-gray-200"
                  />
                </Form.Item>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Background & Header Colors */}
      <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-25 shadow-none border border-slate-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <SettingOutlined className="text-lg text-slate-600" />
          Background & Header
        </h3>

        <Row gutter={[12, 16]}>
          {backgroundColors.map((item) => (
            <Col xs={24} sm={12} lg={6} key={item.name}>
              <Card className={`border-0 bg-gradient-to-br ${item.bg} shadow-none border ${item.border}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-lg">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{item.label}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                </div>
                <Form.Item name={item.name} className="mb-0">
                  <Input
                    type="color"
                    className="h-10 sm:h-12 rounded-lg cursor-pointer border-gray-200"
                  />
                </Form.Item>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Chat Bubble Colors */}
      <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-25 shadow-none border border-amber-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <MessageOutlined className="text-lg text-amber-600" />
          Chat Bubble Colors
        </h3>

        <Row gutter={[12, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-25 shadow-none border border-blue-100">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm mb-2 flex items-center gap-1"><RobotOutlined className="text-blue-600" /> Admin Bubble</p>
              <p className="text-xs text-gray-600 mb-3">Admin message color</p>
              <Form.Item name="chatBubbleAdmin" className="mb-0">
                <Input type="color" className="h-10 sm:h-12 rounded-lg cursor-pointer border-gray-200" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-25 shadow-none border border-blue-100">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm mb-2 flex items-center gap-1"><EditOutlined className="text-blue-600" /> Admin Text</p>
              <p className="text-xs text-gray-600 mb-3">Text in admin bubble</p>
              <Form.Item name="chatBubbleAdminText" className="mb-0">
                <Input type="color" className="h-10 sm:h-12 rounded-lg cursor-pointer border-gray-200" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-25 shadow-none border border-emerald-100">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm mb-2 flex items-center gap-1"><UserOutlined className="text-emerald-600" /> User Bubble</p>
              <p className="text-xs text-gray-600 mb-3">User message color</p>
              <Form.Item name="chatBubbleUser" className="mb-0">
                <Input type="color" className="h-10 sm:h-12 rounded-lg cursor-pointer border-gray-200" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-25 shadow-none border border-emerald-100">
              <p className="font-semibold text-gray-900 text-xs sm:text-sm mb-2 flex items-center gap-1"><FontColorsOutlined className="text-emerald-600" /> User Text</p>
              <p className="text-xs text-gray-600 mb-3">Text in user bubble</p>
              <Form.Item name="chatBubbleUserText" className="mb-0">
                <Input type="color" className="h-10 sm:h-12 rounded-lg cursor-pointer border-gray-200" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}

/* ========== CHAT STYLING TAB ========== */

function ChatStylingTab({ handleImageUpload }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Message Styling */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-25 shadow-none border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <MessageOutlined className="text-lg text-blue-600" />
          Message Styling
        </h3>

        <Row gutter={[12, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Font Size (px)</span>}
              name="messageFontSize"
              initialValue={14}
            >
              <Slider
                min={10}
                max={20}
                step={1}
                marks={{ 10: '10', 14: '14', 18: '18', 20: '20' }}
                tooltip={{ formatter: (value) => `${value}px` }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Border Radius (px)</span>}
              name="messageBorderRadius"
              initialValue={12}
            >
              <Slider
                min={0}
                max={30}
                step={2}
                marks={{ 0: 'Sharp', 12: 'Rounded', 24: 'Pill' }}
                tooltip={{ formatter: (value) => `${value}px` }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Bubble Style</span>}
              name="bubbleStyle"
              initialValue="rounded"
            >
              <Select
                options={[
                  { label: 'Rounded', value: 'rounded' },
                  { label: 'Square', value: 'square' },
                  { label: 'Pill', value: 'pill' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Blur Effect</span>}
              name="blurEffect"
              initialValue={0.1}
            >
              <Slider
                min={0}
                max={1}
                step={0.1}
                marks={{ 0: 'None', 0.5: 'Med', 1: 'Full' }}
                tooltip={{ formatter: (value) => value.toFixed(1) }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Background Image */}
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-25 shadow-none border border-purple-100">
        <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
          <FileImageOutlined className="text-lg text-purple-600" />
          Chat Background
        </h3>

        <Form.Item
          label={<span className="font-semibold text-gray-700 text-xs sm:text-sm">Background Image</span>}
          name="chatBackgroundImage"
        >
          <Upload
            {...handleImageUpload('chatBackgroundImage')}
            maxCount={1}
            listType="picture-card"
          >
            <div className="flex flex-col items-center gap-1 sm:gap-2">
              <UploadOutlined className="text-xl sm:text-2xl text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Upload</span>
            </div>
          </Upload>
        </Form.Item>
        <p className="text-xs text-gray-600 flex items-center gap-1">
          <BulbOutlined className="text-amber-500" /> 1920x1080 JPG/PNG
        </p>
      </Card>
    </div>
  );
}

/* ========== FEATURES TAB ========== */

function FeaturesTab() {
  const features = [
    {
      name: 'showAvatars',
      title: 'Show User Avatars',
      desc: 'Display profile pictures next to messages',
      icon: <UserOutlined className="text-blue-600" />,
      bg: 'from-blue-50 to-blue-25',
      border: 'border-blue-100',
    },
    {
      name: 'showReadStatus',
      title: 'Show Read Status',
      desc: 'Display checkmarks when message is read',
      icon: <CheckOutlined className="text-emerald-600" />,
      bg: 'from-emerald-50 to-emerald-25',
      border: 'border-emerald-100',
    },
    {
      name: 'enableTypingIndicator',
      title: 'Typing Indicator',
      desc: 'Show animated "typing..." indicator',
      icon: <LoadingOutlined className="text-amber-600" />,
      bg: 'from-amber-50 to-amber-25',
      border: 'border-amber-100',
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {features.map((feature) => (
        <Card key={feature.name} className={`border-0 bg-gradient-to-r ${feature.bg} shadow-none border ${feature.border} hover:shadow-md transition-shadow`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 flex items-start gap-2 sm:gap-3">
              <div className="text-xl sm:text-2xl flex-shrink-0">{feature.icon}</div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-xs sm:text-sm">{feature.title}</p>
                <p className="text-xs text-gray-600 mt-0.5">{feature.desc}</p>
              </div>
            </div>
            <Form.Item
              name={feature.name}
              valuePropName="checked"
              className="m-0 flex-shrink-0"
            >
              <Switch />
            </Form.Item>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ========== TYPING BUBBLE ========== */

function TypingBubble({ theme }) {
  return (
    <div
      className="px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-1.5 sm:gap-2 shadow-sm w-fit"
      style={{
        backgroundColor: theme.chatBubbleAdmin,
        color: theme.chatBubbleAdminText,
        borderRadius: `${theme.messageBorderRadius || 15}px`,
      }}
    >
      <span className="inline-flex gap-1">
        <span
          className="inline-block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-current animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="inline-block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-current animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="inline-block w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-current animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </span>
    </div>
  );
}

/* ========== PREVIEW CHAT ========== */

function PreviewChat({ theme }) {
  return (
    <div
      className="flex flex-col rounded-lg overflow-hidden border h-80 sm:h-96 shadow-sm"
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 border-b font-semibold text-sm sm:text-base flex-shrink-0"
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
            style={{ height: `${Math.min(theme.logoHeight || 40, 32)}px` }}
          />
        )}
        <span className="font-semibold text-xs sm:text-sm">{theme.appName || 'Chat App'}</span>
      </div>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 relative flex flex-col gap-3 sm:gap-4"
        style={{
          backgroundImage: theme.chatBackgroundImage ? `url(${theme.chatBackgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${theme.blurEffect || 0.1})`,
          }}
        />

        <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
          {/* Admin Message */}
          <div className="flex items-end justify-start gap-2">
            {theme.showAvatars && (
              <Avatar
                style={{ backgroundColor: theme.chatBubbleAdmin }}
                size="small"
                className="flex-shrink-0"
              >
                A
              </Avatar>
            )}
            <div
              className="px-3 sm:px-4 py-1.5 sm:py-2 max-w-xs break-words shadow-sm text-xs sm:text-sm"
              style={{
                backgroundColor: theme.chatBubbleAdmin,
                color: theme.chatBubbleAdminText,
                borderRadius: `${theme.messageBorderRadius || 12}px`,
                fontSize: `${theme.messageFontSize || 14}px`,
              }}
            >
              Hello! How can I help you?
              {theme.showReadStatus && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-xs">
                  <CheckOutlined /><CheckOutlined />
                </span>
              )}
            </div>
          </div>

          {/* User Message */}
          <div className="flex items-end justify-end gap-2">
            <div
              className="px-3 sm:px-4 py-1.5 sm:py-2 max-w-xs break-words shadow-sm text-xs sm:text-sm"
              style={{
                backgroundColor: theme.chatBubbleUser,
                color: theme.chatBubbleUserText,
                borderRadius: `${theme.messageBorderRadius || 12}px`,
                fontSize: `${theme.messageFontSize || 14}px`,
              }}
            >
              I need help with my account.
              {theme.showReadStatus && (
                <span className="ml-2 inline-flex items-center text-xs">
                  <CheckOutlined />
                </span>
              )}
            </div>
            {theme.showAvatars && (
              <Avatar
                style={{ backgroundColor: theme.primaryColor }}
                size="small"
                className="flex-shrink-0"
              >
                U
              </Avatar>
            )}
          </div>

          {/* Typing Indicator */}
          {theme.enableTypingIndicator && (
            <div className="flex items-end justify-start gap-2">
              {theme.showAvatars && (
                <Avatar
                  style={{ backgroundColor: theme.chatBubbleAdmin }}
                  size="small"
                  className="flex-shrink-0"
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
        className="flex items-center gap-2 p-2 sm:p-4 border-t"
        style={{
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
        }}
      >
        <input
          type="text"
          placeholder="Type..."
          className="flex-1 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none"
          style={{
            backgroundColor: theme.secondaryColor,
            borderColor: theme.borderColor,
            color: theme.headerText,
          }}
          disabled
        />
        <button
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold disabled:opacity-60"
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