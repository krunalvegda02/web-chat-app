import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../hooks/useTheme';
import { fetchContacts, searchUsers, addContact, removeContact, clearSearchResults } from '../../redux/slices/contactSlice';
import { Card, Input, Button, Avatar, List, Empty, Spin, Modal, Form, message, Popconfirm } from 'antd';
import { UserAddOutlined, SearchOutlined, PhoneOutlined, MailOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createDirectRoom } from '../../redux/slices/chatSlice';

export default function Contacts() {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { contacts, searchResults, loading, searchLoading } = useSelector((s) => s.contacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      const timer = setTimeout(() => {
        dispatch(searchUsers(searchQuery));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchQuery, dispatch]);

  const handleAddContact = async (values) => {
    try {
      await dispatch(addContact(values)).unwrap();
      message.success('Contact added successfully');
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error || 'Failed to add contact');
    }
  };

  const handleRemoveContact = async (userId) => {
    try {
      await dispatch(removeContact(userId)).unwrap();
      message.success('Contact removed');
    } catch (error) {
      message.error(error || 'Failed to remove contact');
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const result = await dispatch(createDirectRoom({ userId })).unwrap();
      navigate('/user/chat');
    } catch (error) {
      message.error('Failed to start chat');
    }
  };

  return (
    <div className="h-screen p-4" style={{ backgroundColor: theme.backgroundColor || '#F0F2F5' }}>
      <Card
        className="border-0"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: '12px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold m-0" style={{ color: theme.headerText || '#1F2937' }}>
            Contacts
          </h1>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setIsModalOpen(true)}
            style={{ backgroundColor: theme.primaryColor || '#00A884' }}
          >
            Add Contact
          </Button>
        </div>

        <Input
          placeholder="Search contacts..."
          prefix={<SearchOutlined style={{ color: theme.primaryColor || '#00A884' }} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="large"
          allowClear
          style={{ borderRadius: '8px', marginBottom: '16px' }}
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : contacts.length > 0 ? (
          <List
            dataSource={contacts}
            renderItem={(contact) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    icon={<MessageOutlined />}
                    onClick={() => handleStartChat(contact.userId._id)}
                    style={{ color: theme.primaryColor || '#00A884' }}
                  >
                    Chat
                  </Button>,
                  <Popconfirm
                    title="Remove contact?"
                    onConfirm={() => handleRemoveContact(contact.userId._id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      Remove
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={48}
                      style={{ backgroundColor: theme.primaryColor || '#00A884' }}
                    >
                      {contact.contactName?.charAt(0)?.toUpperCase() || contact.userId.name?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  }
                  title={contact.contactName || contact.userId.name}
                  description={
                    <div>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-xs">
                          <PhoneOutlined /> {contact.phone}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1 text-xs">
                          <MailOutlined /> {contact.email}
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No contacts yet" />
        )}
      </Card>

      <Modal
        title="Add New Contact"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleAddContact} layout="vertical">
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: 'Phone number is required' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="+1234567890" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input prefix={<MailOutlined />} placeholder="email@example.com" />
          </Form.Item>
          <Form.Item name="contactName" label="Contact Name">
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ backgroundColor: theme.primaryColor || '#00A884' }}
            >
              Add Contact
            </Button>
          </Form.Item>
        </Form>

        {searchQuery.length >= 3 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Search Results</h3>
            {searchLoading ? (
              <Spin />
            ) : searchResults.length > 0 ? (
              <List
                size="small"
                dataSource={searchResults}
                renderItem={(user) => (
                  <List.Item
                    actions={[
                      <Button
                        size="small"
                        type="link"
                        onClick={() => {
                          form.setFieldsValue({
                            phone: user.phone,
                            email: user.email,
                            contactName: user.name,
                          });
                        }}
                      >
                        Use
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar size={32}>{user.name?.charAt(0)?.toUpperCase()}</Avatar>}
                      title={user.name}
                      description={user.phone || user.email}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No users found" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
