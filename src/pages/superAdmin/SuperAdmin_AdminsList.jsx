import { useEffect, useState } from 'react';
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
  Row,
  Col,
  Typography,
  Popconfirm,
  Statistic,
  List,
} from 'antd';
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
  LockOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAllTenants,
  createTenant,
  deleteTenant,
} from '../../redux/slices/tenantSlice.jsx';

const { Title, Text } = Typography;

export default function SuperAdminAdminsList() {
  useAuthGuard(['SUPER_ADMIN']);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { tenants, loading } = useSelector((state) => state.tenant);

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchAdmins = async () => {
    await dispatch(getAllTenants());
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const tenantsArray = Array.isArray(tenants)
    ? tenants
    : tenants?.data?.tenants || tenants?.tenants || [];

  const handleCreateAdmin = async (values) => {
    const result = await dispatch(createTenant(values));
    if (result.type === 'tenant/createTenant/fulfilled') {
      form.resetFields();
      setModalOpen(false);
      await fetchAdmins();
    }
  };

  const handleDeleteTenant = async (id) => {
    await dispatch(deleteTenant(id));
    await fetchAdmins();
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
            style={{
              backgroundColor: '#00806920',
            }}
          >
            <UserOutlined
              style={{
                color: '#008069',
                fontSize: '18px',
              }}
            />
          </div>
          <div className="min-w-0">
            <p
              className="font-semibold text-sm truncate"
              style={{ color: '#111B21' }}
            >
              {name}
            </p>
            <p
              className="text-xs truncate"
              style={{ color: '#9CA3AF' }}
            >
              ID: {record._id?.slice(0, 8)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: ['admin', 'email'],
      key: 'email',
      responsive: ['md'],
      render: (email) => (
        <div className="flex items-center gap-2">
          <MailOutlined
            style={{
              color: '#008069',
            }}
          />
          <Text
            className="truncate"
            style={{
              color: '#111B21',
            }}
          >
            {email || 'N/A'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      responsive: ['lg'],
      render: () => (
        <Tag
          icon={<CheckCircleOutlined />}
          style={{
            backgroundColor: '#ECFDF5',
            color: '#10B981',
            border: '1px solid #10B981',
            borderRadius: '6px',
            padding: '2px 8px',
          }}
        >
          Active
        </Tag>
      ),
    },
    {
      title: 'Created',
      key: 'created',
      responsive: ['lg'],
      render: (_, record) => (
        <Text style={{ color: '#6B7280', fontSize: '13px' }}>
          {record.createdAt
            ? new Date(record.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
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
              style={{
                color: '#008069',
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Admin"
            description="Are you sure you want to delete this admin workspace?"
            icon={<ExclamationCircleOutlined style={{ color: '#EF4444' }} />}
            onConfirm={() => handleDeleteTenant(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{
              danger: true,
            }}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                danger
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
      style={{ 
        backgroundColor: '#F0F2F5',
        height: 'calc(100vh - 50px)',
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <Title
              level={2}
              style={{
                color: '#111B21',
                margin: 0,
                fontSize: 'clamp(20px, 5vw, 28px)',
              }}
            >
              Admin Workspaces
            </Title>
            <Text style={{ color: '#667781', fontSize: '14px' }}>
              Manage tenant workspaces & their admins
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
            size="large"
            className="w-full sm:w-auto"
            style={{
              backgroundColor: '#008069',
              borderColor: '#008069',
              height: '44px',
              borderRadius: '8px',
              fontWeight: 500,
            }}
          >
            <span className="hidden sm:inline">Add New Admin</span>
            <span className="sm:hidden">Add Admin</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={12} md={8}>
            <Card
              className="border-0"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={
                  <span style={{ color: '#6B7280', fontSize: '13px' }}>
                    Total Admins
                  </span>
                }
                value={tenantsArray.length}
                prefix={
                  <TeamOutlined
                    style={{
                      color: '#008069',
                      fontSize: '20px',
                    }}
                  />
                }
                valueStyle={{
                  color: '#111B21',
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={8}>
            <Card
              className="border-0"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={
                  <span style={{ color: '#6B7280', fontSize: '13px' }}>
                    Active Workspaces
                  </span>
                }
                value={tenantsArray.length}
                prefix={
                  <AppstoreOutlined
                    style={{
                      color: '#10B981',
                      fontSize: '20px',
                    }}
                  />
                }
                valueStyle={{
                  color: '#111B21',
                  fontSize: 'clamp(20px, 4vw, 28px)',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Card
              className="border-0"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRadius: '12px',
              }}
            >
              <Statistic
                title={
                  <span style={{ color: '#6B7280', fontSize: '13px' }}>
                    Status
                  </span>
                }
                value="All Active"
                prefix={
                  <CheckCircleOutlined
                    style={{
                      color: '#10B981',
                      fontSize: '20px',
                    }}
                  />
                }
                valueStyle={{
                  color: '#10B981',
                  fontSize: 'clamp(16px, 3vw, 20px)',
                  fontWeight: 600,
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Table */}
      <Card
        className="border-0"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: '12px',
        }}
      >
        {tenantsArray.length > 0 ? (
          <Table
            columns={columns}
            dataSource={tenantsArray}
            loading={loading}
            rowKey="_id"
            scroll={{ x: 800 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total}`,
              responsive: true,
            }}
            rowClassName="hover:bg-gray-50 transition-colors"
          />
        ) : (
          <Empty
            description="No admin workspaces found"
            style={{ padding: '40px 0' }}
          />
        )}
      </Card>

      {/* Create Admin Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: '#00806920',
              }}
            >
              <UserOutlined
                style={{
                  color: '#008069',
                  fontSize: '20px',
                }}
              />
            </div>
            <span
              style={{
                color: '#111B21',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              Create New Admin Workspace
            </span>
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={500}
        centered
        style={{
          borderRadius: '12px',
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAdmin}
          autoComplete="off"
        >
          <Form.Item
            label={
              <span
                style={{
                  color: '#111B21',
                  fontWeight: 500,
                }}
              >
                Workspace Name
              </span>
            }
            name="name"
            rules={[
              {
                required: true,
                message: 'Please enter workspace name',
              },
            ]}
          >
            <Input
              placeholder="Enter workspace name"
              size="large"
              prefix={
                <UserOutlined
                  style={{ color: '#008069' }}
                />
              }
              style={{
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span
                style={{
                  color: '#111B21',
                  fontWeight: 500,
                }}
              >
                Admin Email
              </span>
            }
            name="email"
            rules={[
              {
                required: true,
                type: 'email',
                message: 'Please enter valid email',
              },
            ]}
          >
            <Input
              placeholder="admin@example.com"
              size="large"
              prefix={
                <MailOutlined
                  style={{ color: '#008069' }}
                />
              }
              style={{
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item
            label={
              <span
                style={{
                  color: '#111B21',
                  fontWeight: 500,
                }}
              >
                Password
              </span>
            }
            name="password"
            rules={[
              {
                required: true,
                min: 6,
                message: 'Password must be at least 6 characters',
              },
            ]}
          >
            <Input.Password
              placeholder="Enter password (min 6 characters)"
              size="large"
              prefix={
                <LockOutlined
                  style={{ color: '#008069' }}
                />
              }
              style={{
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                backgroundColor: '#008069',
                borderColor: '#008069',
                height: '44px',
                borderRadius: '8px',
                fontWeight: 500,
              }}
            >
              Create Workspace
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
