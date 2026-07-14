import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Select,
  Tag,
  Typography,
  Space,
  Empty,
  Popconfirm,
  Statistic,
  Badge,
  Tabs,
  message,
  Tooltip,
  Image,
} from 'antd';
import {
  WalletOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusCircleOutlined,
  UserOutlined,
  HistoryOutlined,
  DollarOutlined,
  BankOutlined,
  SafetyOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  fetchPendingRequests,
  approveCreditRequest,
  rejectCreditRequest,
  addCreditsManually,
  fetchWalletHistory,
  fetchBankDetails,
  updateBankDetails,
} from '../../redux/slices/walletSlice';
import { getAllPlatforms } from '../../redux/slices/platformSlice';
import clsx from 'clsx';

const { Title, Text } = Typography;

export default function SuperAdminWalletRequests() {
  useAuthGuard(['SUPER_ADMIN']);
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const { pendingRequests, transactions, loading, pendingPagination, pagination, bankDetails } = useSelector((s) => s.wallet);
  const { platforms } = useSelector((s) => s.platform);

  const [addCreditsModal, setAddCreditsModal] = useState(false);
  const [bankModal, setBankModal] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [addForm] = Form.useForm();
  const [bankForm] = Form.useForm();
  
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // New state for Approve/Reject Modal
  const [actionModal, setActionModal] = useState({ visible: false, type: '', record: null });
  const [actionRemark, setActionRemark] = useState('');

  const showDetails = (record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  useEffect(() => {
    dispatch(fetchPendingRequests({}));
    dispatch(fetchWalletHistory({}));
    dispatch(fetchBankDetails());
    dispatch(getAllPlatforms());
  }, [dispatch]);

  const handleActionSubmit = async () => {
    try {
      if (actionModal.type === 'APPROVE') {
        await dispatch(approveCreditRequest({ transactionId: actionModal.record._id, remark: actionRemark })).unwrap();
        message.success('Credit request approved');
      } else {
        await dispatch(rejectCreditRequest({ transactionId: actionModal.record._id, remark: actionRemark })).unwrap();
        message.success('Credit request rejected');
      }
      setActionModal({ visible: false, type: '', record: null });
      setActionRemark('');
      dispatch(fetchPendingRequests({}));
    } catch (err) {
      message.error(err || `Failed to ${actionModal.type.toLowerCase()}`);
    }
  };

  const handleAddCredits = async (values) => {
    try {
      await dispatch(addCreditsManually(values)).unwrap();
      message.success(`${values.amount} ChatCoin added successfully`);
      setAddCreditsModal(false);
      addForm.resetFields();
      dispatch(fetchWalletHistory({}));
    } catch (err) {
      message.error(err || 'Failed to add credits');
    }
  };

  const handleBankUpdate = async (values) => {
    try {
      await dispatch(updateBankDetails(values)).unwrap();
      message.success('Bank details updated');
      setBankModal(false);
    } catch (err) {
      message.error(err || 'Failed to update bank details');
    }
  };

  const openBankModal = () => {
    if (bankDetails) {
      bankForm.setFieldsValue({
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        upiId: bankDetails.upiId,
      });
    }
    setBankModal(true);
  };

  // Get admin list for select dropdown
  const platformAdmins = (() => {
    const arr = Array.isArray(platforms) ? platforms : platforms?.data?.platforms || platforms?.platforms || [];
    return arr.map((p) => ({
      value: p.adminId?._id || p.admin?._id,
      label: `${p.admin?.name || p.adminId?.name || p.name} (${p.admin?.email || p.adminId?.email || ''})`,
    })).filter(a => a.value);
  })();

  const pendingColumns = [
    {
      title: 'Admin',
      dataIndex: 'userId',
      key: 'admin',
      render: (user) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{user?.name || '—'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{user?.email || ''}</Text>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: theme.primaryColor || '#008069', fontSize: 15 }}>
          {amount?.toLocaleString()} <span style={{ fontSize: 11, opacity: 0.6 }}>CC</span>
        </Text>
      ),
    },
    {
      title: 'UTR',
      dataIndex: 'utr',
      key: 'utr',
      responsive: ['md'],
      render: (utr) => utr ? <Text copyable style={{ fontSize: 13, color: theme.sidebarTextColor || '#111B21' }}>{utr}</Text> : '—',
      width: 200,
    },
    {
      title: 'Screenshot',
      dataIndex: 'screenshotUrl',
      key: 'screenshot',
      responsive: ['sm'],
      render: (url) => url ? (
        <Image
          src={url}
          width={40}
          height={40}
          style={{ borderRadius: 6, objectFit: 'cover' }}
          preview={{ mask: <span style={{ fontSize: 10 }}>View</span> }}
        />
      ) : '—',
      width: 110,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      responsive: ['lg'],
      render: (date) => new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      }),
      width: 160,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div className={clsx('flex', 'items-center', 'gap-2', 'flex-wrap')}>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showDetails(record)}
              className={clsx('flex', 'items-center', 'justify-center', 'text-blue-600', 'bg-blue-50', 'border-blue-100', 'hover:bg-blue-100', 'hover:border-blue-200', 'rounded-md', 'shadow-sm')}
            />
          </Tooltip>
          <Tooltip title="Approve Request">
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => setActionModal({ visible: true, type: 'APPROVE', record })}
              className={clsx('flex', 'items-center', 'justify-center', 'text-emerald-700', 'bg-emerald-50', 'border-emerald-200', 'hover:bg-emerald-100', 'hover:border-emerald-300', 'rounded-md', 'shadow-sm')}
            />
          </Tooltip>
          <Tooltip title="Reject Request">
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => setActionModal({ visible: true, type: 'REJECT', record })}
              className={clsx('flex', 'items-center', 'justify-center', 'text-red-600', 'bg-red-50', 'border-red-200', 'hover:bg-red-100', 'hover:border-red-300', 'rounded-md', 'shadow-sm')}
            />
          </Tooltip>
        </div>
      ),
      width: 140,
    },
  ];

  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    },
    {
      title: 'Admin',
      dataIndex: 'userId',
      key: 'admin',
      render: (user) => <Text>{user?.name || '—'} <Text type="secondary" style={{ fontSize: 11 }}>({user?.email})</Text></Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      responsive: ['sm'],
      render: (type) => {
        const config = {
          CREDIT_REQUEST: { color: 'blue', label: 'Credit Request' },
          CREDIT_APPROVED: { color: 'green', label: 'Credit Added' },
          CREDIT_REJECTED: { color: 'red', label: 'Credit Rejected' },
          MESSAGE_DEBIT: { color: 'volcano', label: 'Message Cost' },
        };
        const c = config[type] || { color: 'default', label: type };
        return <Tag color={c.color}>{c.label}</Tag>;
      },
      width: 130,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount?.toLocaleString()} CC
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      responsive: ['sm'],
      render: (status) => {
        const config = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
        return <Tag color={config[status]}>{status}</Tag>;
      },
      width: 110,
    },
    {
      title: 'Approved By',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      responsive: ['md'],
      render: (user) => user?.name || '—',
      width: 150,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetails(record)}
            className={clsx('flex', 'items-center', 'justify-center', 'text-blue-600', 'bg-blue-50', 'border-blue-100', 'hover:bg-blue-100', 'hover:border-blue-200', 'rounded-md', 'shadow-sm')}
          />
        </Tooltip>
      ),
      width: 80,
    },
  ];

  return (
    <div
      className={clsx('h-screen', 'sm:min-h-screen', 'p-3', 'sm:p-4', 'md:p-6', 'overflow-y-auto')}
      style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5', height: 'calc(100vh - 50px)' }}
    >
      {/* Header */}
      <Card className="mb-4 border-0 shadow-sm" bodyStyle={{ padding: '24px' }} style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', borderRadius: '12px' }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.sidebarTextColor || '#111B21', margin: 0 }}>
              Wallet Management
            </h1>
            <p className="text-sm mt-1" style={{ color: theme.timestampColor || '#667781', margin: 0 }}>
              Manage credit requests, add credits, and configure bank details
            </p>
          </div>
          <div className={clsx('flex', 'flex-col', 'sm:flex-row', 'w-full', 'sm:w-auto', 'gap-3')}>
            <Button
              icon={<BankOutlined />}
              onClick={openBankModal}
              size="large"
              className={clsx('w-full', 'sm:w-auto')}
              style={{ borderRadius: '8px', fontWeight: 500 }}
            >
              Bank Details
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddCreditsModal(true)}
              size="large"
              className={clsx('w-full', 'sm:w-auto')}
              style={{ backgroundColor: theme.sidebarHeaderColor || '#008069', borderColor: theme.sidebarHeaderColor || '#008069', height: '44px', borderRadius: '8px', fontWeight: 500 }}
            >
              Add Credits
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <Card className="border-0 hover:shadow-md transition-shadow" style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '16px' }} bodyStyle={{ padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <Text style={{ color: theme.timestampColor || '#667781', fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Pending Requests
              </Text>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight" style={{ color: '#faad14' }}>
                  {pendingPagination.total || 0}
                </span>
                <span style={{ color: theme.timestampColor || '#667781', fontSize: '14px', fontWeight: 500 }}>
                  awaiting action
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}>
              <ClockCircleOutlined style={{ color: '#faad14', fontSize: '26px' }} />
            </div>
          </div>
        </Card>
        
        <Card className="border-0 hover:shadow-md transition-shadow" style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderRadius: '16px' }} bodyStyle={{ padding: '24px' }}>
          <div className="flex items-center justify-between">
            <div>
              <Text style={{ color: theme.timestampColor || '#667781', fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Total Transactions
              </Text>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight" style={{ color: theme.sidebarTextColor || '#111B21' }}>
                  {pagination.total || 0}
                </span>
                <span style={{ color: theme.timestampColor || '#667781', fontSize: '14px', fontWeight: 500 }}>
                  processed
                </span>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: `${theme.sidebarHeaderColor || '#008069'}10`, border: `1px solid ${theme.sidebarHeaderColor || '#008069'}30` }}>
              <HistoryOutlined style={{ color: theme.sidebarHeaderColor || '#008069', fontSize: '26px' }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-0" style={{ backgroundColor: theme.inputBackgroundColor || '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }} bodyStyle={{ padding: '4px 20px 20px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 20 }}
          items={[
            {
              key: 'pending',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined /> Pending Requests
                  {(pendingPagination.total || 0) > 0 && (
                    <span style={{ 
                      backgroundColor: '#faad14', 
                      color: '#fff', 
                      borderRadius: '10px', 
                      padding: '0 8px', 
                      fontSize: 12, 
                      fontWeight: 'bold',
                      lineHeight: '20px'
                    }}>
                      {pendingPagination.total}
                    </span>
                  )}
                </span>
              ),
              children: (
                <Table
                  dataSource={pendingRequests}
                  columns={pendingColumns}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: pendingPagination.page,
                    pageSize: pendingPagination.limit,
                    total: pendingPagination.total,
                    showSizeChanger: false,
                    onChange: (page) => dispatch(fetchPendingRequests({ page })),
                  }}
                  locale={{ emptyText: <Empty description="No pending requests" /> }}
                  scroll={{ x: 'max-content' }}
                  size="middle"
                />
              ),
            },
            {
              key: 'history',
              label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HistoryOutlined /> All Transactions
                </span>
              ),
              children: (
                <Table
                  dataSource={transactions}
                  columns={historyColumns}
                  rowKey="_id"
                  loading={loading}
                  pagination={{
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: pagination.total,
                    showSizeChanger: false,
                    onChange: (page) => dispatch(fetchWalletHistory({ page })),
                  }}
                  locale={{ emptyText: <Empty description="No transactions yet" /> }}
                  scroll={{ x: 'max-content' }}
                  size="middle"
                />
              ),
            },
          ]}
        />
      </Card>

      {/* Add Credits Modal */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <PlusCircleOutlined style={{ color: theme.primaryColor || '#008069' }} /> Add Credits Manually
          </span>
        }
        open={addCreditsModal}
        onCancel={() => { setAddCreditsModal(false); addForm.resetFields(); }}
        footer={null}
        width={460}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleAddCredits} requiredMark={false}>
          <Form.Item
            name="userId"
            label={<Text strong>Platform Admin</Text>}
            rules={[{ required: true, message: 'Select a platform admin' }]}
          >
            <Select
              placeholder="Select admin"
              size="large"
              style={{ borderRadius: 8 }}
              showSearch
              optionFilterProp="label"
              options={platformAdmins}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label={<Text strong>Amount (ChatCoin)</Text>}
            rules={[
              { required: true, message: 'Enter amount' },
              { type: 'number', min: 1, message: 'Must be at least 1' },
            ]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              size="large"
              placeholder="e.g. 5000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/,/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label={<Text strong>Remark (Optional)</Text>}
          >
            <Input.TextArea 
              rows={2} 
              placeholder="e.g. Bonus credits for promotion" 
              style={{ borderRadius: 8 }} 
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              height: 48,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00A884 0%, #008069 100%)',
              border: 'none',
            }}
          >
            Add Credits
          </Button>
        </Form>
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            <BankOutlined style={{ color: theme.primaryColor || '#008069' }} /> Bank Details
          </span>
        }
        open={bankModal}
        onCancel={() => { setBankModal(false); bankForm.resetFields(); }}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          Platform Admins will see these details when purchasing credits.
        </Text>
        <Form form={bankForm} layout="vertical" onFinish={handleBankUpdate} requiredMark={false}>
          <Form.Item
            name="bankName"
            label={<Text strong>Bank Name</Text>}
            rules={[{ required: true, message: 'Enter bank name' }]}
          >
            <Input size="large" placeholder="e.g. State Bank of India" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item
            name="accountNumber"
            label={<Text strong>Account Number</Text>}
            rules={[
              { required: true, message: 'Enter account number' },
              { pattern: /^\d{9,18}$/, message: 'Must be 9-18 digits' },
            ]}
          >
            <Input size="large" placeholder="e.g. 1234567890123" style={{ borderRadius: 8, fontFamily: 'monospace' }} maxLength={18} />
          </Form.Item>

          <Form.Item
            name="ifscCode"
            label={<Text strong>IFSC Code</Text>}
            rules={[
              { required: true, message: 'Enter IFSC code' },
              { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC format (e.g. SBIN0001234)' },
            ]}
          >
            <Input
              size="large"
              placeholder="e.g. SBIN0001234"
              style={{ borderRadius: 8, fontFamily: 'monospace', textTransform: 'uppercase' }}
              maxLength={11}
              onChange={(e) => bankForm.setFieldValue('ifscCode', e.target.value.toUpperCase())}
            />
          </Form.Item>

          <Form.Item
            name="upiId"
            label={<Text strong>UPI ID</Text>}
            rules={[
              { required: true, message: 'Enter UPI ID' },
              { pattern: /^[\w.\-]{2,256}@[A-Za-z0-9.-]+$/, message: 'Invalid UPI format (e.g. name@upi)' },
            ]}
          >
            <Input size="large" placeholder="e.g. admin@paytm" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            size="large"
            style={{
              height: 48,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00A884 0%, #008069 100%)',
              border: 'none',
            }}
          >
            Save Bank Details
          </Button>
        </Form>
      </Modal>
      
      {/* Action Modal (Approve/Reject with Remark) */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
            {actionModal.type === 'APPROVE' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )}
            {actionModal.type === 'APPROVE' ? 'Approve Request' : 'Reject Request'}
          </span>
        }
        open={actionModal.visible}
        onCancel={() => { setActionModal({ visible: false, type: '', record: null }); setActionRemark(''); }}
        onOk={handleActionSubmit}
        okText={actionModal.type === 'APPROVE' ? 'Confirm Approve' : 'Confirm Reject'}
        okButtonProps={{ danger: actionModal.type === 'REJECT', style: actionModal.type === 'APPROVE' ? { background: '#52c41a' } : {} }}
        confirmLoading={loading}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, fontSize: 15 }}>
          Are you sure you want to <strong>{actionModal.type === 'APPROVE' ? 'approve' : 'reject'}</strong> this request for <strong style={{ color: theme.primaryColor || '#008069' }}>{actionModal.record?.amount?.toLocaleString()} ChatCoin</strong> from <strong>{actionModal.record?.userId?.name || actionModal.record?.admin?.name || 'this admin'}</strong>?
        </div>
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Remark (Optional):</Text>
          <Input.TextArea
            rows={3}
            placeholder={`Enter a remark for this ${actionModal.type === 'APPROVE' ? 'approval' : 'rejection'}...`}
            value={actionRemark}
            onChange={(e) => setActionRemark(e.target.value)}
            style={{ borderRadius: 8 }}
          />
        </div>
      </Modal>

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedRecord && (
          <div className={clsx('flex', 'flex-col', 'gap-4')}>
            <div>
              <Text type="secondary">Transaction ID</Text>
              <div><Text strong>{selectedRecord._id}</Text></div>
            </div>
            <div>
              <Text type="secondary">Admin / Platform</Text>
              <div><Text strong>{selectedRecord.userId?.name || selectedRecord.admin?.name || '—'} ({selectedRecord.userId?.email || selectedRecord.admin?.email || ''})</Text></div>
            </div>
            <div>
              <Text type="secondary">Amount</Text>
              <div><Text strong style={{ color: selectedRecord.amount > 0 ? '#52c41a' : '#ff4d4f' }}>{selectedRecord.amount > 0 ? '+' : ''}{selectedRecord.amount?.toLocaleString()} CC</Text></div>
            </div>
            <div>
              <Text type="secondary">Type</Text>
              <div>
                <Tag color={
                  selectedRecord.type === 'CREDIT_REQUEST' ? 'blue' :
                  selectedRecord.type === 'CREDIT_APPROVED' ? 'green' :
                  selectedRecord.type === 'CREDIT_REJECTED' ? 'red' :
                  selectedRecord.type === 'MESSAGE_DEBIT' ? 'volcano' : 'default'
                }>
                  {selectedRecord.type === 'CREDIT_REQUEST' ? 'Credit Request' :
                   selectedRecord.type === 'CREDIT_APPROVED' ? 'Credit Added' :
                   selectedRecord.type === 'CREDIT_REJECTED' ? 'Credit Rejected' :
                   selectedRecord.type === 'MESSAGE_DEBIT' ? 'Message Cost' : selectedRecord.type}
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">Status</Text>
              <div><Tag color={selectedRecord.status === 'APPROVED' ? 'green' : selectedRecord.status === 'REJECTED' ? 'red' : 'orange'}>{selectedRecord.status}</Tag></div>
            </div>
            <div>
              <Text type="secondary">Date</Text>
              <div><Text>{new Date(selectedRecord.createdAt).toLocaleString('en-IN')}</Text></div>
            </div>
            {selectedRecord.utr && (
              <div>
                <Text type="secondary">UTR Number</Text>
                <div><Text copyable>{selectedRecord.utr}</Text></div>
              </div>
            )}
            {selectedRecord.screenshotUrl && (
              <div>
                <Text type="secondary">Screenshot</Text>
                <div className="mt-2">
                  <a href={selectedRecord.screenshotUrl} target="_blank" rel="noopener noreferrer">
                    <img src={selectedRecord.screenshotUrl} alt="Payment Screenshot" className={clsx('max-w-full', 'rounded', 'border', 'hover:opacity-90', 'transition-opacity')} style={{ maxHeight: 300, objectFit: 'contain' }} />
                  </a>
                </div>
              </div>
            )}
            {selectedRecord.notes && (
              <div>
                <Text type="secondary">Notes</Text>
                <div><Text>{selectedRecord.notes}</Text></div>
              </div>
            )}
            {selectedRecord.remark && (
              <div>
                <Text type="secondary">Remark</Text>
                <div><Text>{selectedRecord.remark}</Text></div>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
}
