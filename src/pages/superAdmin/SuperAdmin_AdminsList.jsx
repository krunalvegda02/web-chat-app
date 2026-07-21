import { useEffect, useState, useMemo } from 'react';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tooltip,
  Space,
  Tag,
  Empty,
  Typography,
  Popconfirm,
  List,
  Select,
  Pagination,
  App,
  message,
  Alert,
  Switch,
  InputNumber,
  Divider,
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  MailOutlined,
  LockOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  SearchOutlined,
  FilterOutlined,
  KeyOutlined,
  CopyOutlined,
  WalletOutlined,
  DollarCircleOutlined,
  StopOutlined,
  UnlockOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllPlatforms,
  createPlatform,
  togglePlatformStatus,
  updatePlatform,
  changeAdminPassword,
} from '../../redux/slices/platformSlice.jsx';
import { addCreditsManually } from '../../redux/slices/walletSlice.jsx';
import clsx from 'clsx';

const { Title, Text } = Typography;

export default function SuperAdminAdminsList() {
  useAuthGuard(['SUPER_ADMIN']);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { platforms, loading } = useSelector((state) => state.platform);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);


  // API Key modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [displayedApiKey, setDisplayedApiKey] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Change password modal state
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdTarget, setPwdTarget] = useState(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditTarget, setCreditTarget] = useState(null);
  const [creditLoading, setCreditLoading] = useState(false);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [creditForm] = Form.useForm();

  const fetchAdmins = async () => {
    await dispatch(getAllPlatforms());
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

const copyApiKey = () => {
    navigator.clipboard.writeText(displayedApiKey);
    setApiKeyCopied(true);
    message.success('API key copied!');
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const platformsArray = Array.isArray(platforms)
    ? platforms
    : platforms?.data?.platforms || platforms?.platforms || [];

  const filteredPlatforms = useMemo(() => {
    let filtered = platformsArray;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.admin?.email?.toLowerCase().includes(query) ||
        p.admin?.phone?.includes(query)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    return filtered;
  }, [platformsArray, searchQuery, statusFilter]);

  const paginatedPlatforms = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPlatforms.slice(start, start + pageSize);
  }, [filteredPlatforms, currentPage, pageSize]);

  const handleCreateAdmin = async (values) => {
    setCreateLoading(true);
    try {
      const result = await dispatch(createPlatform(values));
      
      if (result.type === 'platform/createPlatform/fulfilled') {
        // Extract apiKey directly from result — don't rely on useEffect timing
        const apiKey = result.payload?.data?.platform?.apiKey || result.payload?.data?.apiKey;
        if (apiKey) {
          setDisplayedApiKey(apiKey);
          setApiKeyModalOpen(true);
        }
        message.success('Platform admin created successfully!');
        form.resetFields();
        setModalOpen(false);
        setSearchQuery('');
        setStatusFilter('all');
        setCurrentPage(1);
        await fetchAdmins();
      } else if (result.type === 'platform/createPlatform/rejected') {
        const errorMessage = result.payload || result.error?.message || 'Failed to create platform admin';
        if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
          message.error('This phone number is already registered. Please use a different phone number.');
        } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
          message.error('This email address is already registered. Please use a different email address.');
        } else if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already exists')) {
          message.error('A platform admin with these details already exists. Please check your information.');
        } else if (errorMessage.toLowerCase().includes('validation')) {
          message.error('Please check your input data and try again.');
        } else {
          message.error(errorMessage);
        }
      }
    } catch (error) {
      message.error('An unexpected error occurred. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const result = await dispatch(togglePlatformStatus(id));
    if (result.type === 'platform/togglePlatformStatus/fulfilled') {
      message.success(`Platform ${currentStatus === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`);
      await fetchAdmins();
    } else {
      message.error('Failed to update platform status');
    }
  };

  const handleToggleSenderCharge = async (id, currentVal) => {
    try {
      const result = await dispatch(updatePlatform({ id, senderCharge: currentVal }));
      if (result.type === 'platform/updatePlatform/fulfilled') {
        message.success(`Sender charge ${currentVal ? 'enabled' : 'disabled'} successfully`);
        await fetchAdmins();
      } else {
        message.error('Failed to update sender charge');
      }
    } catch (error) {
      message.error('An unexpected error occurred');
    }
  };

  const handleChangePassword = (record) => {
    setPwdTarget(record);
    pwdForm.resetFields();
    setPwdModalOpen(true);
  };

  const handleSubmitPassword = async (values) => {
    setPwdLoading(true);
    try {
      const result = await dispatch(changeAdminPassword({ id: pwdTarget._id, password: values.password }));
      if (result.type === 'platform/changeAdminPassword/fulfilled') {
        message.success(`Password changed for ${pwdTarget.name}`);
        setPwdModalOpen(false);
        pwdForm.resetFields();
      } else {
        message.error(result.payload || 'Failed to change password');
      }
    } catch {
      message.error('An unexpected error occurred');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleOpenCreditModal = (record) => {
    if (!record.admin?._id) {
      message.error("Platform admin account not found.");
      return;
    }
    setCreditTarget(record);
    creditForm.resetFields();
    setCreditModalOpen(true);
  };

  const handleSubmitCredit = async (values) => {
    setCreditLoading(true);
    try {
      const result = await dispatch(addCreditsManually({
        userId: creditTarget.admin._id,
        amount: values.amount,
        remark: values.remark || 'Manual top up by Super Admin'
      }));
      if (result.type === 'wallet/addManually/fulfilled') {
        message.success(`Added ${values.amount} ChatCoin to ${creditTarget.name}`);
        setCreditModalOpen(false);
        creditForm.resetFields();
        await fetchAdmins();
      } else {
        message.error(result.payload || 'Failed to add credit');
      }
    } catch {
      message.error('An unexpected error occurred');
    } finally {
      setCreditLoading(false);
    }
  };

  const handleEditPlatform = (record) => {
    setEditingPlatform(record);
    editForm.setFieldsValue({
      name: record.name,
      email: record.admin?.email,
      phone: record.admin?.phone,
      senderCharge: record.senderCharge || false,
      textCost: record.customPricing?.textCost,
      mediaCost: record.customPricing?.mediaCost,
      textTranslationCost: record.customPricing?.textTranslationCost,
      voiceCost: record.customPricing?.voiceCost,
      voiceTranslationCost: record.customPricing?.voiceTranslationCost,
    });
    setEditModalOpen(true);
  };

  const handleUpdatePlatform = async (values) => {
    setUpdateLoading(true);
    try {
      const { textCost, mediaCost, textTranslationCost, voiceCost, voiceTranslationCost, ...restValues } = values;
      
      const payload = {
        id: editingPlatform._id,
        ...restValues
      };

      if (textCost !== undefined || mediaCost !== undefined || textTranslationCost !== undefined || voiceCost !== undefined || voiceTranslationCost !== undefined) {
         payload.customPricing = { textCost, mediaCost, textTranslationCost, voiceCost, voiceTranslationCost };
      } else {
         payload.customPricing = null;
      }

      const result = await dispatch(updatePlatform(payload));
      
      if (result.type === 'platform/updatePlatform/fulfilled') {
        message.success('Platform updated successfully!');
        editForm.resetFields();
        setEditModalOpen(false);
        setEditingPlatform(null);
        await fetchAdmins();
      } else if (result.type === 'platform/updatePlatform/rejected') {
        const errorMessage = result.payload || result.error?.message || 'Failed to update platform';
        if (errorMessage.toLowerCase().includes('phone') && errorMessage.toLowerCase().includes('already')) {
          message.error('This phone number is already registered by another admin. Please use a different phone number.');
        } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
          message.error('This email address is already registered by another admin. Please use a different email address.');
        } else if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already exists')) {
          message.error('Another platform admin with these details already exists.');
        } else {
          message.error(errorMessage);
        }
      }
    } catch (error) {
      message.error('An unexpected error occurred while updating. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const columns = [
    {
      title: 'Admin Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className={clsx('flex', 'items-center', 'gap-3')}>
          <div className={clsx('w-10', 'h-10', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')}
            style={{ backgroundColor: `${theme.sidebarHeaderColor || '#008069'}20` }}
          >
            <UserOutlined style={{ color: theme.sidebarHeaderColor || '#008069', fontSize: '18px' }} />
          </div>
          <div className="min-w-0">
            <p className={clsx('font-semibold', 'text-sm', 'truncate')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{name}</p>
            <p className={clsx('text-xs', 'truncate')} style={{ color: theme.timestampColor || '#9CA3AF' }}>ID: {record._id?.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['admin', 'email'],
      key: 'email',
      render: (email) => (
        <div className={clsx('flex', 'items-center', 'gap-2')}>
          <MailOutlined style={{ color: theme.sidebarHeaderColor || '#008069' }} />
          <Text className="truncate" style={{ color: theme.sidebarTextColor || '#111B21' }}>{email || 'N/A'}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag
          icon={record.status === 'ACTIVE' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
          style={{
            backgroundColor: record.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2',
            color: record.status === 'ACTIVE' ? '#10B981' : '#EF4444',
            border: `1px solid ${record.status === 'ACTIVE' ? '#10B981' : '#EF4444'}`,
            borderRadius: '6px',
            padding: '2px 8px',
          }}
        >
          {record.status || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      key: 'created',
      render: (_, record) => (
        <Text style={{ color: theme.timestampColor || '#6B7280', fontSize: '13px' }}>
          {record.createdAt
            ? new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Wallet Balance',
      dataIndex: ['admin', 'walletBalance'],
      key: 'walletBalance',
      render: (balance) => (
        <div className={clsx('flex', 'items-center', 'gap-2')}>
          <div className={clsx('p-1.5', 'rounded-md', 'flex', 'items-center', 'justify-center')} style={{ backgroundColor: '#F3E8FF', color: '#9333EA' }}>
            <WalletOutlined style={{ fontSize: '14px' }} />
          </div>
          <Text style={{ color: theme.sidebarTextColor || '#111B21', fontWeight: 600 }}>
            {balance !== undefined ? balance.toLocaleString() : '0'} <span className={clsx('text-xs', 'font-normal', 'text-gray-500')}>Coins</span>
          </Text>
        </div>
      ),
    },
    {
      title: 'Sender Charge',
      dataIndex: 'senderCharge',
      key: 'senderCharge',
      width: 130,
      render: (senderCharge, record) => (
        <Switch 
          checked={senderCharge}
          onChange={(checked) => handleToggleSenderCharge(record._id, checked)}
          checkedChildren="Yes"
          unCheckedChildren="No"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, record) => (
        <div className={clsx('flex', 'items-center', 'gap-1')}>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditPlatform(record)}
              style={{ color: theme.sidebarHeaderColor || '#008069' }}
            />
          </Tooltip>
          <Tooltip title="Change Password">
            <Button
              type="text"
              icon={<UnlockOutlined />}
              size="small"
              onClick={() => handleChangePassword(record)}
              style={{ color: theme.sidebarHeaderColor || '#008069' }}
            />
          </Tooltip>
          <Tooltip title="Add Credit">
            <Button
              type="text"
              icon={<DollarCircleOutlined />}
              size="small"
              onClick={() => handleOpenCreditModal(record)}
              style={{ color: '#10B981' }}
            />
          </Tooltip>
          <Popconfirm
            title={`${record.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Admin`}
            description={`Are you sure you want to ${record.status === 'ACTIVE' ? 'deactivate' : 'activate'} this admin workspace?`}
            icon={<ExclamationCircleOutlined style={{ color: record.status === 'ACTIVE' ? '#F59E0B' : '#10B981' }} />}
            onConfirm={() => handleToggleStatus(record._id, record.status)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ style: { backgroundColor: record.status === 'ACTIVE' ? '#F59E0B' : '#10B981' } }}
          >
            <Tooltip title={record.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
              <Button
                type="text"
                icon={record.status === 'ACTIVE' ? <StopOutlined /> : <CheckCircleOutlined />}
                size="small"
                style={{ color: record.status === 'ACTIVE' ? '#EF4444' : '#10B981' }}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div
      className={clsx('h-screen', 'sm:min-h-screen', 'p-3', 'sm:p-4', 'md:p-6', 'overflow-y-auto')}
      style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5', height: 'calc(100vh - 50px)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className={clsx('flex', 'flex-col', 'sm:flex-row', 'items-start', 'sm:items-center', 'justify-between', 'gap-4', 'mb-6')}>
          <div>
            <Title level={2} style={{ color: theme.sidebarTextColor || '#111B21', margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>
              Admin Workspaces
            </Title>
            <Text style={{ color: theme.timestampColor || '#667781', fontSize: '14px' }}>Manage platform workspaces & their admins</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            size="large"
            className={clsx('w-full', 'sm:w-auto')}
            style={{ backgroundColor: theme.sidebarHeaderColor || '#008069', borderColor: theme.sidebarHeaderColor || '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}
          >
            <span className={clsx('hidden', 'sm:inline')}>Add New Admin</span>
            <span className="sm:hidden">Add Admin</span>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className={clsx('flex', 'flex-col', 'sm:flex-row', 'items-center', 'gap-4', 'mb-2')}>
          <Input
            placeholder="Search by name, email, or phone..."
            prefix={<SearchOutlined style={{ color: theme.sidebarHeaderColor || '#008069' }} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            allowClear
            onClear={() => { setSearchQuery(''); setCurrentPage(1); }}
            size="large"
            className={clsx('flex-1', 'w-full')}
            style={{ borderRadius: '8px', backgroundColor: theme.inputBackgroundColor || '#FFFFFF' }}
            autoComplete="off"
          />
          <Select
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
            size="large"
            className={clsx('w-full', 'sm:w-48', 'shrink-0')}
            style={{ borderRadius: '8px' }}
            suffixIcon={<FilterOutlined style={{ color: theme.sidebarHeaderColor || '#008069' }} />}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="INACTIVE">Inactive</Select.Option>
          </Select>
        </div>
        <Text style={{ color: theme.timestampColor || '#667781', fontSize: '13px' }}>
          Showing <span style={{ color: theme.sidebarHeaderColor || '#008069', fontWeight: 600 }}>{filteredPlatforms.length}</span> of <span style={{ color: theme.sidebarHeaderColor || '#008069', fontWeight: 600 }}>{platformsArray.length}</span> admin{platformsArray.length !== 1 ? 's' : ''}
        </Text>
      </div>

      {/* Table - Desktop */}
      <Card className={clsx('border-0', 'hidden', 'md:block')} style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
        {filteredPlatforms.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredPlatforms}
            loading={loading}
            rowKey="_id"
            className={clsx('admin-list-table', 'custom-hover-table')}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}` }}
            rowClassName="hover:bg-gray-50 transition-colors"
          />
        ) : (
          <Empty description="No platforms found" style={{ padding: '40px 0' }} />
        )}
      </Card>

      {/* List - Mobile */}
      <div className="md:hidden ">
        {paginatedPlatforms.length > 0 ? (
          <>
            <List
              dataSource={paginatedPlatforms}
              loading={loading}
              renderItem={(item) => (
              <Card className={clsx('mb-3', 'border-0')} style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div className={clsx('flex', 'items-start', 'gap-3')}>
                  <div className={clsx('w-12', 'h-12', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'flex-shrink-0')} style={{ backgroundColor: `${theme.sidebarHeaderColor || '#008069'}20` }}>
                    <UserOutlined style={{ color: theme.sidebarHeaderColor || '#008069', fontSize: '20px' }} />
                  </div>
                  <div className={clsx('flex-1', 'min-w-0')}>
                    <div className={clsx('flex', 'items-start', 'justify-between', 'mb-2')}>
                      <div className={clsx('flex-1', 'min-w-0')}>
                        <p className={clsx('font-semibold', 'text-base', 'truncate')} style={{ color: theme.sidebarTextColor || '#111B21' }}>{item.name}</p>
                        <p className="text-xs" style={{ color: theme.timestampColor || '#9CA3AF' }}>ID: {item._id?.slice(0, 8)}...</p>
                      </div>
                      <Tag
                        icon={item.status === 'ACTIVE' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        style={{
                          backgroundColor: item.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2',
                          color: item.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                          border: `1px solid ${item.status === 'ACTIVE' ? '#10B981' : '#EF4444'}`,
                          borderRadius: '6px', padding: '2px 8px', marginLeft: '8px', flexShrink: 0,
                        }}
                      >
                        {item.status || 'ACTIVE'}
                      </Tag>
                    </div>
                    <div className={clsx('space-y-1', 'mb-3')}>
                      <div className={clsx('flex', 'items-center', 'gap-2')}>
                        <MailOutlined style={{ color: theme.sidebarHeaderColor || '#008069', fontSize: '14px' }} />
                        <Text className={clsx('text-sm', 'truncate')} style={{ color: theme.timestampColor || '#667781' }}>{item.admin?.email || 'N/A'}</Text>
                      </div>
                      {item.admin?.phone && (
                        <div className={clsx('flex', 'items-center', 'gap-2')}>
                          <PhoneOutlined style={{ color: theme.sidebarHeaderColor || '#008069', fontSize: '14px' }} />
                          <Text className="text-sm" style={{ color: theme.timestampColor || '#667781' }}>{item.admin.phone}</Text>
                        </div>
                      )}
                      <div className={clsx('flex', 'items-center', 'gap-2')}>
                        <Text className="text-xs" style={{ color: theme.timestampColor || '#9CA3AF' }}>
                          Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </Text>
                      </div>
                    </div>
                    {/* 2-col grid so buttons never overflow */}
                    <div className={clsx('grid', 'grid-cols-2', 'gap-2')}>
                      <Button type="default" icon={<EditOutlined />} size="small" onClick={() => handleEditPlatform(item)} style={{ color: theme.sidebarHeaderColor || '#008069', borderColor: theme.sidebarHeaderColor || '#008069', borderRadius: '6px' }}>Edit</Button>
                      <Button type="default" icon={<KeyOutlined />} size="small" onClick={() => handleChangePassword(item)} style={{ color: theme.sidebarHeaderColor || '#008069', borderColor: theme.sidebarHeaderColor || '#008069', borderRadius: '6px' }}>Password</Button>
                      <Popconfirm
                        title={`${item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'} Admin`}
                        description={`Are you sure you want to ${item.status === 'ACTIVE' ? 'deactivate' : 'activate'} this admin workspace?`}
                        icon={<ExclamationCircleOutlined style={{ color: item.status === 'ACTIVE' ? '#F59E0B' : '#10B981' }} />}
                        onConfirm={() => handleToggleStatus(item._id, item.status)}
                        okText="Yes" cancelText="No"
                        okButtonProps={{ style: { backgroundColor: item.status === 'ACTIVE' ? '#F59E0B' : '#10B981' } }}
                      >
                        <Button
                          type="default"
                          icon={item.status === 'ACTIVE' ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
                          size="small"
                          style={{ color: item.status === 'ACTIVE' ? '#F59E0B' : '#10B981', borderColor: item.status === 'ACTIVE' ? '#F59E0B' : '#10B981', borderRadius: '6px', width: '100%' }}
                        >
                          {item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </Button>
                      </Popconfirm>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            />
            <div className={clsx('mt-4', 'flex', 'justify-center')}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredPlatforms.length}
                onChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                showSizeChanger
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          </>
        ) : (
          <Card className="border-0" style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
            <Empty description="No platforms found" style={{ padding: '40px 0' }} />
          </Card>
        )}
      </div>

      {/* Create Admin Modal */}
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-3')}>
            <div className={clsx('p-2', 'rounded-lg')} style={{ backgroundColor: '#00806920' }}>
              <UserOutlined style={{ color: '#008069', fontSize: '20px' }} />
            </div>
            <span style={{ color: '#111B21', fontSize: '18px', fontWeight: 600 }}>Create New Admin Workspace</span>
          </div>
        }
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        width={500}
        centered
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAdmin} autoComplete="off">
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Platform name</span>} name="name" rules={[{ required: true, message: 'Please enter Platform name' }]}>
            <Input placeholder="Enter Platform name" size="large" prefix={<UserOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Admin Email</span>} name="email" rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}>
            <Input placeholder="admin@example.com" size="large" prefix={<MailOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Phone Number</span>} name="phone">
            <Input placeholder="+1234567890" size="large" prefix={<PhoneOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Password</span>} name="password" rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}>
            <Input.Password placeholder="Enter password (min 6 characters)" size="large" prefix={<LockOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Sender Charge (Charge Users for Messages)</span>} name="senderCharge" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={createLoading} block size="large" style={{ backgroundColor: '#008069', borderColor: '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}>
              {createLoading ? 'Creating Workspace...' : 'Create Workspace'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-3')}>
            <div className={clsx('p-2', 'rounded-lg')} style={{ backgroundColor: '#00806920' }}>
              <EditOutlined style={{ color: '#008069', fontSize: '20px' }} />
            </div>
            <span style={{ color: '#111B21', fontSize: '18px', fontWeight: 600 }}>Edit Admin Workspace</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingPlatform(null); editForm.resetFields(); }}
        footer={null}
        width={500}
        centered
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdatePlatform} autoComplete="off">
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Platform name</span>} name="name" rules={[{ required: true, message: 'Please enter Platform name' }]}>
            <Input placeholder="Enter Platform name" size="large" prefix={<UserOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Admin Email</span>} name="email" rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}>
            <Input placeholder="admin@example.com" size="large" prefix={<MailOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Phone Number</span>} name="phone">
            <Input placeholder="+1234567890" size="large" prefix={<PhoneOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Sender Charge (Charge Users for Messages)</span>} name="senderCharge" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Divider orientation="left" plain style={{ margin: '12px 0' }}>Custom Pricing (Optional)</Divider>
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px', fontSize: '12px' }}>
            Set a specific price for this platform to override the global pricing. Leave empty to use global pricing.
          </Text>
          
          <div className={clsx('flex', 'gap-4')}>
            <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Text Cost</span>} name="textCost" className="flex-1">
              <InputNumber placeholder="e.g. 5" min={0} size="large" style={{ width: '100%', borderRadius: '8px' }} />
            </Form.Item>
            <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Media Cost</span>} name="mediaCost" className="flex-1">
              <InputNumber placeholder="e.g. 20" min={0} size="large" style={{ width: '100%', borderRadius: '8px' }} />
            </Form.Item>
          </div>
          
          <div className={clsx('flex', 'gap-4')}>
            <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Text Translation</span>} name="textTranslationCost" className="flex-1">
              <InputNumber placeholder="e.g. 10" min={0} size="large" style={{ width: '100%', borderRadius: '8px' }} />
            </Form.Item>
            <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Voice Cost</span>} name="voiceCost" className="flex-1">
              <InputNumber placeholder="e.g. 15" min={0} size="large" style={{ width: '100%', borderRadius: '8px' }} />
            </Form.Item>
          </div>

          <div className={clsx('flex', 'gap-4')}>
            <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Voice Translation</span>} name="voiceTranslationCost" className="flex-1">
              <InputNumber placeholder="e.g. 25" min={0} size="large" style={{ width: '100%', borderRadius: '8px' }} />
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={updateLoading} block size="large" style={{ backgroundColor: '#008069', borderColor: '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}>
              {updateLoading ? 'Updating Workspace...' : 'Update Workspace'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-3')}>
            <div className={clsx('p-2', 'rounded-lg')} style={{ backgroundColor: `${theme.sidebarHeaderColor || '#008069'}20` }}>
              <KeyOutlined style={{ color: theme.sidebarHeaderColor || '#008069', fontSize: '20px' }} />
            </div>
            <span style={{ color: theme.sidebarTextColor || '#111B21', fontSize: '18px', fontWeight: 600 }}>Change Password — {pwdTarget?.name}</span>
          </div>
        }
        open={pwdModalOpen}
        onCancel={() => { setPwdModalOpen(false); pwdForm.resetFields(); }}
        footer={null}
        width={440}
        centered
      >
        <Form form={pwdForm} layout="vertical" onFinish={handleSubmitPassword} autoComplete="off">
          <Form.Item
            label={<span style={{ color: theme.sidebarTextColor || '#111B21', fontWeight: 500 }}>New Password</span>}
            name="password"
            rules={[{ required: true, min: 6, message: 'Password must be at least 6 characters' }]}
          >
            <Input.Password
              placeholder="Enter new password"
              size="large"
              prefix={<LockOutlined style={{ color: theme.sidebarHeaderColor || '#008069' }} />}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item
            label={<span style={{ color: theme.sidebarTextColor || '#111B21', fontWeight: 500 }}>Confirm Password</span>}
            name="confirmPassword"
            rules={[
              { required: true, message: 'Please confirm the password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm new password"
              size="large"
              prefix={<LockOutlined style={{ color: theme.sidebarHeaderColor || '#008069' }} />}
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={pwdLoading}
              block
              size="large"
              style={{ backgroundColor: theme.sidebarHeaderColor || '#008069', borderColor: theme.sidebarHeaderColor || '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}
            >
              {pwdLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* API Key Modal - shown once after platform creation */}
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-3')}>
            <div className={clsx('p-2', 'rounded-lg')} style={{ backgroundColor: '#00806920' }}>
              <KeyOutlined style={{ color: '#008069', fontSize: '20px' }} />
            </div>
            <span style={{ color: '#111B21', fontSize: '18px', fontWeight: 600 }}>Platform API Key Generated</span>
          </div>
        }
        open={apiKeyModalOpen}
        onCancel={() => setApiKeyModalOpen(false)}
        footer={
          <Button type="primary" onClick={() => setApiKeyModalOpen(false)} style={{ backgroundColor: '#008069', borderColor: '#008069', borderRadius: '8px' }}>
            Done
          </Button>
        }
        width={520}
        centered
        closable={false}
        maskClosable={false}
      >
        <div className="py-2">
          <Alert
            message="Save this API key now — it won't be shown again."
            type="warning"
            showIcon
            style={{ marginBottom: '16px', borderRadius: '8px' }}
          />
          <p className={clsx('text-sm', 'mb-3')} style={{ color: '#667781' }}>
            The platform admin can use this key to integrate the chat widget into their platform.
          </p>
          <div
            className={clsx('flex', 'items-center', 'gap-2', 'p-3', 'rounded-lg')}
            style={{ backgroundColor: '#F0F2F5', border: '1px solid #E9EDEF' }}
          >
            <code className={clsx('flex-1', 'text-sm', 'break-all', 'select-all')} style={{ color: '#111B21', fontFamily: 'monospace' }}>
              {displayedApiKey}
            </code>
            <Tooltip title={apiKeyCopied ? 'Copied!' : 'Copy'}>
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={copyApiKey}
                style={{ color: apiKeyCopied ? '#10B981' : '#008069', flexShrink: 0 }}
              />
            </Tooltip>
          </div>
        </div>
      </Modal>
      <Modal
        title={
          <div className={clsx('flex', 'items-center', 'gap-2')}>
            <DollarOutlined style={{ color: '#10B981', fontSize: '20px' }} />
            <span>Add Credits to {creditTarget?.name}</span>
          </div>
        }
        open={creditModalOpen}
        onCancel={() => {
          setCreditModalOpen(false);
          creditForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={creditForm}
          layout="vertical"
          onFinish={handleSubmitCredit}
          className="mt-4"
        >
          <Form.Item
            name="amount"
            label="Amount (ChatCoins)"
            rules={[{ required: true, message: 'Please enter the amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              size="large"
              placeholder="e.g. 100"
            />
          </Form.Item>
          
          <Form.Item
            name="remark"
            label="Remark"
            rules={[{ required: true, message: 'Please enter a remark' }]}
          >
            <Input.TextArea
              placeholder="Reason for adding credits..."
              rows={3}
            />
          </Form.Item>

          <Form.Item className={clsx('mb-0', 'text-right', 'mt-6')}>
            <Space>
              <Button onClick={() => setCreditModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={creditLoading} style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
                Add Credits
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
