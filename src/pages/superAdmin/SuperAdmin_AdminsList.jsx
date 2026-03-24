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
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllPlatforms,
  createPlatform,
  togglePlatformStatus,
  updatePlatform,
} from '../../redux/slices/platformSlice.jsx';

const { Title, Text } = Typography;

export default function SuperAdminAdminsList() {
  useAuthGuard(['SUPER_ADMIN']);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { platforms, loading } = useSelector((state) => state.platform);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // API Key modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [displayedApiKey, setDisplayedApiKey] = useState('');
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

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

  const handleEditTenant = (record) => {
    setEditingTenant(record);
    editForm.setFieldsValue({
      name: record.name,
      email: record.admin?.email,
      phone: record.admin?.phone,
    });
    setEditModalOpen(true);
  };

  const handleUpdateTenant = async (values) => {
    setUpdateLoading(true);
    try {
      const result = await dispatch(updatePlatform({ id: editingTenant._id, ...values }));
      
      if (result.type === 'platform/updatePlatform/fulfilled') {
        message.success('Platform updated successfully!');
        editForm.resetFields();
        setEditModalOpen(false);
        setEditingTenant(null);
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
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#00806920' }}
          >
            <UserOutlined style={{ color: '#008069', fontSize: '18px' }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: '#111B21' }}>{name}</p>
            <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>ID: {record._id?.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['admin', 'email'],
      key: 'email',
      responsive: ['sm'],
      render: (email) => (
        <div className="flex items-center gap-2">
          <MailOutlined style={{ color: '#008069' }} />
          <Text className="truncate" style={{ color: '#111B21' }}>{email || 'N/A'}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      responsive: ['sm'],
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
      responsive: ['sm'],
      render: (_, record) => (
        <Text style={{ color: '#6B7280', fontSize: '13px' }}>
          {record.createdAt
            ? new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A'}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditTenant(record)}
              style={{ color: '#008069' }}
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
                icon={record.status === 'ACTIVE' ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}
                size="small"
                style={{ color: record.status === 'ACTIVE' ? '#F59E0B' : '#10B981' }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div
      className="h-screen sm:min-h-screen p-3 sm:p-4 md:p-6 overflow-y-auto"
      style={{ backgroundColor: '#F0F2F5', height: 'calc(100vh - 50px)' }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <Title level={2} style={{ color: '#111B21', margin: 0, fontSize: 'clamp(20px, 5vw, 28px)' }}>
              Admin Workspaces
            </Title>
            <Text style={{ color: '#667781', fontSize: '14px' }}>Manage tenant workspaces & their admins</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            size="large"
            className="w-full sm:w-auto"
            style={{ backgroundColor: '#008069', borderColor: '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}
          >
            <span className="hidden sm:inline">Add New Admin</span>
            <span className="sm:hidden">Add Admin</span>
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-2">
          <Input
            placeholder="Search by name, email, or phone..."
            prefix={<SearchOutlined style={{ color: '#008069' }} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            allowClear
            onClear={() => { setSearchQuery(''); setCurrentPage(1); }}
            size="large"
            style={{ borderRadius: '8px' }}
            autoComplete="off"
          />
          <Select
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
            size="large"
            style={{ width: '100%', minWidth: '150px', borderRadius: '8px' }}
            suffixIcon={<FilterOutlined style={{ color: '#008069' }} />}
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="ACTIVE">Active</Select.Option>
            <Select.Option value="INACTIVE">Inactive</Select.Option>
          </Select>
        </div>
        <Text style={{ color: '#667781', fontSize: '13px' }}>
          Showing <span style={{ color: '#008069', fontWeight: 600 }}>{filteredPlatforms.length}</span> of <span style={{ color: '#008069', fontWeight: 600 }}>{platformsArray.length}</span> admin{platformsArray.length !== 1 ? 's' : ''}
        </Text>
      </div>

      {/* Table - Desktop */}
      <Card className="border-0 hidden md:block" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
        {filteredPlatforms.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredPlatforms}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`, responsive: true }}
            rowClassName="hover:bg-gray-50 transition-colors"
          />
        ) : (
          <Empty description="No platforms found" style={{ padding: '40px 0' }} />
        )}
      </Card>

      {/* List - Mobile */}
      <div className="md:hidden">
        {paginatedPlatforms.length > 0 ? (
          <>
            <List
              dataSource={paginatedPlatforms}
              loading={loading}
              renderItem={(item) => (
              <Card className="mb-3 border-0" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00806920' }}>
                    <UserOutlined style={{ color: '#008069', fontSize: '20px' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate" style={{ color: '#111B21' }}>{item.name}</p>
                        <p className="text-xs" style={{ color: '#9CA3AF' }}>ID: {item._id?.slice(0, 8)}...</p>
                      </div>
                      <Tag
                        icon={item.status === 'ACTIVE' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                        style={{
                          backgroundColor: item.status === 'ACTIVE' ? '#ECFDF5' : '#FEF2F2',
                          color: item.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                          border: `1px solid ${item.status === 'ACTIVE' ? '#10B981' : '#EF4444'}`,
                          borderRadius: '6px', padding: '2px 8px', marginLeft: '8px',
                        }}
                      >
                        {item.status || 'ACTIVE'}
                      </Tag>
                    </div>
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2">
                        <MailOutlined style={{ color: '#008069', fontSize: '14px' }} />
                        <Text className="text-sm truncate" style={{ color: '#667781' }}>{item.admin?.email || 'N/A'}</Text>
                      </div>
                      {item.admin?.phone && (
                        <div className="flex items-center gap-2">
                          <PhoneOutlined style={{ color: '#008069', fontSize: '14px' }} />
                          <Text className="text-sm" style={{ color: '#667781' }}>{item.admin.phone}</Text>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Text className="text-xs" style={{ color: '#9CA3AF' }}>
                          Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </Text>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="default" icon={<EditOutlined />} size="small" onClick={() => handleEditTenant(item)} style={{ color: '#008069', borderColor: '#008069', borderRadius: '6px', flex: 1 }}>Edit</Button>
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
                          style={{ color: item.status === 'ACTIVE' ? '#F59E0B' : '#10B981', borderColor: item.status === 'ACTIVE' ? '#F59E0B' : '#10B981', borderRadius: '6px', flex: 1 }}
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
            <div className="mt-4 flex justify-center">
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
          <Card className="border-0" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
            <Empty description="No platforms found" style={{ padding: '40px 0' }} />
          </Card>
        )}
      </div>

      {/* Create Admin Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#00806920' }}>
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#00806920' }}>
              <EditOutlined style={{ color: '#008069', fontSize: '20px' }} />
            </div>
            <span style={{ color: '#111B21', fontSize: '18px', fontWeight: 600 }}>Edit Admin Workspace</span>
          </div>
        }
        open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingTenant(null); editForm.resetFields(); }}
        footer={null}
        width={500}
        centered
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdateTenant} autoComplete="off">
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Platform name</span>} name="name" rules={[{ required: true, message: 'Please enter Platform name' }]}>
            <Input placeholder="Enter Platform name" size="large" prefix={<UserOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Admin Email</span>} name="email" rules={[{ required: true, type: 'email', message: 'Please enter valid email' }]}>
            <Input placeholder="admin@example.com" size="large" prefix={<MailOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: '#111B21', fontWeight: 500 }}>Phone Number</span>} name="phone">
            <Input placeholder="+1234567890" size="large" prefix={<PhoneOutlined style={{ color: '#008069' }} />} style={{ borderRadius: '8px' }} />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={updateLoading} block size="large" style={{ backgroundColor: '#008069', borderColor: '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}>
              {updateLoading ? 'Updating Workspace...' : 'Update Workspace'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* API Key Modal - shown once after platform creation */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#00806920' }}>
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
          <p className="text-sm mb-3" style={{ color: '#667781' }}>
            The platform admin can use this key to integrate the chat widget into their platform.
          </p>
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ backgroundColor: '#F0F2F5', border: '1px solid #E9EDEF' }}
          >
            <code className="flex-1 text-sm break-all select-all" style={{ color: '#111B21', fontFamily: 'monospace' }}>
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
    </div>
  );
}
