import { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, message, Avatar, Space, Card, Empty, Spin, Pagination } from 'antd';
import { SearchOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getPlatformUsers } from '../../redux/slices/platformSlice.jsx';
import { useTheme } from '../../hooks/useTheme';

export default function PlatformClients() {
  const { user } = useSelector((s) => s.auth);
  const { platformUsers, loading, pagination } = useSelector((s) => s.platform);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  useEffect(() => {
    if (user?.platformId && !hasInitialLoad) {
      fetchUsers(1, pageSize, '');
      setHasInitialLoad(true);
    }
  }, [user?.platformId]);

  const fetchUsers = async (page = currentPage, limit = pageSize, search = searchText) => {
    if (user?.platformId) {
      await dispatch(getPlatformUsers({ 
        platformId: user.platformId,
        page,
        limit,
        search 
      }));
    }
  };

  useEffect(() => {
    // Only run search effect after initial load and when search text changes
    if (!hasInitialLoad || !user?.platformId || !searchText.trim()) return;
    
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchUsers(1, pageSize, searchText);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchText]);

  const handlePageChange = (page, size) => {
    setCurrentPage(page);
    if (size !== pageSize) {
      setPageSize(size);
    }
    fetchUsers(page, size || pageSize, searchText);
  };

  const handleChat = (chatUser) => {
    navigate(`/admin/user-chat?userId=${chatUser._id}&platformId=${chatUser.platformId}`);
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar}>{record.name?.[0]?.toUpperCase()}</Avatar>
          <div>
            <div className="font-medium text-sm">{record.name}</div>
            <div className="text-xs text-gray-500">{record.email}</div>
          </div>
        </Space>
      ),
      responsive: ['md'],
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['lg'],
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['lg'],
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : status === 'INACTIVE' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
      responsive: ['md'],
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      responsive: ['lg'],
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<MessageOutlined />}
          onClick={() => handleChat(record)}
        >
          Chat
        </Button>
      ),
    },
  ];

  if (loading && platformUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <div className="fixed top-0 right-0 bottom-0 sm:left-20 left-0 flex flex-col" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
        {/* Header */}
        <div className="px-4 py-5 flex items-center justify-between" style={{ background: theme?.sidebarHeaderColor || '#008069' }}>
          <div>
            <h1 className="text-lg font-bold" style={{ color: theme.headerTextColor || '#FFFFFF' }}>Platform Users</h1>
            <p className="text-xs mt-1" style={{ color: theme.headerTextColor || '#FFFFFF', opacity: 0.8 }}>
              {platformUsers.length} users
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
            style={{
              borderRadius: '8px',
              backgroundColor: theme.inputBackgroundColor || '#F0F2F5',
              border: 'none',
            }}
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto pb-14" style={{ backgroundColor: theme.sidebarBackgroundColor || '#FFFFFF' }}>
          {platformUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Empty description="No users found" />
            </div>
          ) : (
            <>
              <div className="p-3 space-y-3">
                {platformUsers.map((user) => (
                  <Card
                    key={user._id}
                    className="border-0 shadow-sm"
                    style={{ borderRadius: '12px' }}
                    bodyStyle={{ padding: '12px' }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        src={user.avatar}
                        size={48}
                        style={{ backgroundColor: theme.avatarBackgroundColor || '#008069', flexShrink: 0 }}
                      >
                        {user.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                          {user.name}
                        </p>
                        <p className="text-xs truncate mt-1" style={{ color: theme.timestampColor || '#667781' }}>
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs truncate mt-1" style={{ color: theme.timestampColor || '#667781' }}>
                            {user.phone}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Tag color={user.status === 'ACTIVE' ? 'green' : user.status === 'INACTIVE' ? 'orange' : 'red'} className="text-xs">
                            {user.status}
                          </Tag>
                          <span className="text-xs" style={{ color: theme.timestampColor || '#667781' }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        icon={<MessageOutlined />}
                        onClick={() => handleChat(user)}
                        style={{ flexShrink: 0 }}
                      >
                        Chat
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              
              {/* Mobile Pagination */}
              {pagination?.total > 0 && (
                <div className="p-4 border-t" style={{ borderColor: theme.sidebarBorderColor || '#E9EDEF' }}>
                  <Pagination
                    current={currentPage}
                    total={pagination.total}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageChange}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} users`}
                    size="small"
                    responsive
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Desktop Table View
  return (
    <div className="p-3 md:p-6" style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5', minHeight: '100vh' }}>
      {/* Header */}
      <Card className="mb-4 border-0 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.sidebarTextColor || '#111B21' }}>Platform Users</h1>
            <p className="text-sm mt-1" style={{ color: theme.timestampColor || '#667781' }}>
              Users are automatically created when they click WhatsApp button on your platform
            </p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search by name, phone, or email"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: '100%', maxWidth: '400px' }}
          allowClear
          size="large"
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <Table
          columns={columns}
          dataSource={platformUsers}
          loading={loading}
          rowKey="_id"
          pagination={{
            current: currentPage,
            total: pagination?.total || 0,
            pageSize: pageSize,
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            responsive: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
