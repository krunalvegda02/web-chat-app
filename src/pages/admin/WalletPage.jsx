import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthGuard } from '../../hooks/useAuthGuard';
import { useTheme } from '../../hooks/useTheme';
import QRCode from 'qrcode';
import {
  Card,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Upload,
  Table,
  Tag,
  Typography,
  Statistic,
  Space,
  Empty,
  Spin,
  Tooltip,
  message,
  Image,
} from 'antd';
import {
  WalletOutlined,
  PlusOutlined,
  HistoryOutlined,
  UploadOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  EyeOutlined,
  InboxOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  fetchWalletBalance,
  fetchWalletHistory,
  requestCredits,
  fetchBankDetails,
} from '../../redux/slices/walletSlice';
import { uploadChatMedia } from '../../redux/slices/chatSlice';
import clsx from 'clsx';

const { Title, Text, Paragraph } = Typography;

export default function WalletPage() {
  useAuthGuard(['PLATFORM_ADMIN']);
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const { balance, currency, transactions, loading, balanceLoading, pagination, bankDetails } = useSelector((s) => s.wallet);

  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [form] = Form.useForm();

  const [fileList, setFileList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const showDetails = (record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  // Fetch balance, history, and bank details on mount
  useEffect(() => {
    dispatch(fetchWalletBalance());
    dispatch(fetchWalletHistory({}));
    dispatch(fetchBankDetails());
  }, [dispatch]);

  // Generate QR code when bank details are available and modal opens
  const generateQR = useCallback(async (amount) => {
    if (!bankDetails?.upiId) return;
    try {
      const upiString = `upi://pay?pa=${bankDetails.upiId}&pn=SuperAdmin&am=${amount || ''}&cu=INR`;
      const dataUrl = await QRCode.toDataURL(upiString, {
        width: 280,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  }, [bankDetails]);

  const openBuyModal = () => {
    setBuyModalOpen(true);
    generateQR('');
  };

  const handleBuy = async (values) => {
    if (fileList.length === 0) {
      message.error('Payment screenshot is required to verify the transaction.');
      return;
    }

    try {
      let finalScreenshotUrl = null;
      if (fileList.length > 0) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('files', fileList[0].originFileObj);
        const uploadRes = await dispatch(uploadChatMedia(formData)).unwrap();
        finalScreenshotUrl = uploadRes?.media?.[0]?.url || uploadRes?.data?.media?.[0]?.url || uploadRes?.data?.[0]?.url || uploadRes?.[0]?.url || null;
        setIsUploading(false);
      }

      await dispatch(requestCredits({
        amount: values.amount,
        utr: values.utr,
        screenshotUrl: finalScreenshotUrl,
      })).unwrap();
      message.success('Credit request submitted! Awaiting Super Admin approval.');
      setBuyModalOpen(false);
      form.resetFields();
      setFileList([]);
      setQrDataUrl(null);
      dispatch(fetchWalletHistory({}));
    } catch (err) {
      setIsUploading(false);
      message.error(err || 'Failed to submit credit request');
    }
  };

  const statusColors = {
    PENDING: 'orange',
    APPROVED: 'green',
    REJECTED: 'red',
  };

  const typeLabels = {
    CREDIT_REQUEST: 'Credit Request',
    CREDIT_APPROVED: 'Credit Added',
    CREDIT_REJECTED: 'Credit Rejected',
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      responsive: ['sm'],
      render: (type) => {
        const colors = {
          CREDIT_REQUEST: 'blue',
          CREDIT_APPROVED: 'green',
          CREDIT_REJECTED: 'red',
          MESSAGE_DEBIT: 'volcano',
        };
        return <Tag color={colors[type] || 'default'}>{typeLabels[type] || type}</Tag>;
      },
      width: 140,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f', fontSize: 14 }}>
          {amount > 0 ? '+' : ''}{amount?.toLocaleString()} <span style={{ fontSize: 11, opacity: 0.7 }}>CC</span>
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const icons = {
          PENDING: <ClockCircleOutlined />,
          APPROVED: <CheckCircleOutlined />,
          REJECTED: <CloseCircleOutlined />,
        };
        return <Tag icon={icons[status]} color={statusColors[status]}>{status}</Tag>;
      },
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
      title: 'UTR',
      dataIndex: 'utr',
      key: 'utr',
      responsive: ['md'],
      render: (utr) => utr ? <Text copyable style={{ fontSize: 13 }}>{utr}</Text> : '—',
      width: 200,
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

  // Card styling
  const cardStyle = {
    background: 'linear-gradient(135deg, #00A884 0%, #008069 100%)',
    borderRadius: 16,
    border: 'none',
    color: '#fff',
    minHeight: 180,
    boxShadow: '0 4px 12px rgba(0, 128, 105, 0.15)',
  };

  return (
    <div className={clsx('p-3', 'md:p-6')} style={{ backgroundColor: theme.sidebarBackgroundColor || '#F0F2F5', minHeight: '100vh' }}>
      {/* Header */}
      <Card className={clsx('mb-4', 'border-0', 'shadow-sm')}>
        <div className={clsx('flex', 'flex-col', 'md:flex-row', 'md:items-center', 'md:justify-between', 'gap-4')}>
          <div>
            <h1 className={clsx('text-2xl', 'font-bold')} style={{ color: theme.sidebarTextColor || '#111B21' }}>
              Wallet
            </h1>
            <p className={clsx('text-sm', 'mt-1')} style={{ color: theme.timestampColor || '#667781' }}>
              Manage your ChatCoin balance and purchase credits
            </p>
          </div>
        </div>
      </Card>

      {/* Balance Card */}
      <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
        <div className={clsx('p-5', 'sm:p-7', 'md:p-8', 'flex', 'flex-col', 'sm:flex-row', 'justify-between', 'items-start', 'sm:items-center', 'gap-5', 'sm:gap-4')}>
          <div>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>
              Available Balance
            </Text>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              {balanceLoading ? (
                <Spin size="large" />
              ) : (
                <>
                  <span className={clsx('text-4xl', 'sm:text-5xl', 'md:text-6xl', 'font-bold', 'text-white', 'leading-none')}>
                    {balance?.toLocaleString() || '0'}
                  </span>
                  <span className={clsx('text-base', 'sm:text-lg', 'text-white/90', 'font-medium')}>
                    ChatCoin
                  </span>
                </>
              )}
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, display: 'block' }}>
              <ThunderboltOutlined /> 5 ChatCoin = 160 character in messages
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={openBuyModal}
            style={{
              background: '#ffffff',
              color: '#008069',
              border: 'none',
              borderRadius: 24,
              height: 48,
              padding: '0 32px',
              fontSize: 16,
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            }}
            className={clsx('w-full', 'sm:w-auto')}
          >
            Buy Credits
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined /> Transaction History
          </span>
        }
        style={{ marginTop: 24, borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={transactions}
          columns={columns}
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
      </Card>

      {/* Buy Credits Modal */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 600 }}>
            <CreditCardOutlined style={{ color: theme.primaryColor || '#008069' }} /> Purchase ChatCoin
          </span>
        }
        open={buyModalOpen}
        onCancel={() => { setBuyModalOpen(false); form.resetFields(); setQrDataUrl(null); setFileList([]); }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <div style={{ marginBottom: 20 }}>
          {/* Bank Details Display */}
          {bankDetails ? (
            <Card
              size="small"
              style={{
                background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
                borderRadius: 12,
                border: '1px solid #e8e8ff',
                marginBottom: 16,
              }}
            >
              <Text strong style={{ fontSize: 13, color: theme.primaryColor || '#008069', display: 'block', marginBottom: 8 }}>
                Payment Details
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: 13 }}>
                <Text type="secondary">Bank:</Text>
                <Text strong copyable>{bankDetails.bankName || '—'}</Text>
                <Text type="secondary">Account:</Text>
                <Text strong copyable style={{ fontFamily: 'monospace' }}>{bankDetails.accountNumber || '—'}</Text>
                <Text type="secondary">IFSC:</Text>
                <Text strong copyable style={{ fontFamily: 'monospace' }}>{bankDetails.ifscCode || '—'}</Text>
                <Text type="secondary">UPI:</Text>
                <Text strong copyable style={{ color: theme.primaryColor || '#008069' }}>{bankDetails.upiId || '—'}</Text>
              </div>
            </Card>
          ) : (
            <Card size="small" style={{ background: '#fff7e6', borderRadius: 12, border: '1px solid #ffe58f', marginBottom: 16 }}>
              <Text type="warning">Super Admin has not set bank details yet. Please contact support.</Text>
            </Card>
          )}

          {/* QR Code */}
          {qrDataUrl && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                display: 'inline-block',
                padding: 16,
                borderRadius: 16,
                background: '#fff',
                boxShadow: '0 4px 24px rgba(118,75,162,0.12)',
                border: '1px solid #f0f0f0',
              }}>
                <img src={qrDataUrl} alt="UPI QR Code" style={{ width: 200, height: 200, borderRadius: 8 }} />
                <div style={{ marginTop: 8 }}>
                  <Tag icon={<QrcodeOutlined />} color="purple">Scan to Pay via UPI</Tag>
                </div>
              </div>
            </div>
          )}
        </div>

        <Form form={form} layout="vertical" onFinish={handleBuy} requiredMark={false}>
          <Form.Item
            name="amount"
            label={<Text strong>Amount (ChatCoin)</Text>}
            rules={[
              { required: true, message: 'Enter amount' },
              { type: 'number', min: 1, max: 1000000, message: 'Between 1 and 1,000,000' },
            ]}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              size="large"
              placeholder="e.g. 5000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/,/g, '')}
              onChange={(val) => generateQR(val)}
            />
          </Form.Item>

          <Form.Item
            name="utr"
            label={<Text strong>UTR (Transaction Reference)</Text>}
            rules={[
              { required: true, message: 'Enter UTR after payment' },
              { pattern: /^[A-Za-z0-9]{12,22}$/, message: 'UTR must be 12‑22 alphanumeric characters' },
            ]}
          >
            <Input
              size="large"
              placeholder="e.g. 202307011234ABCD"
              style={{ borderRadius: 8, fontFamily: 'monospace' }}
              maxLength={22}
            />
          </Form.Item>

          <Form.Item
            name="screenshotFile"
            label={<Text strong>Payment Screenshot <span className="text-red-500">*</span></Text>}
            rules={[{ required: true, message: 'Screenshot is required' }]}
          >
            <Upload.Dragger
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              accept="image/*"
              showUploadList={false}
              style={{ padding: fileList.length > 0 ? 0 : '20px 0', background: '#f8f9ff', borderColor: '#d6e4ff', overflow: 'hidden' }}
            >
              {fileList.length > 0 && fileList[0].originFileObj ? (
                <div style={{ position: 'relative', width: '100%', height: 200 }}>
                  <img
                    src={URL.createObjectURL(fileList[0].originFileObj)}
                    alt="Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<DeleteOutlined />}
                    size="small"
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFileList([]);
                    }}
                  />
                </div>
              ) : (
                <>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ color: theme.primaryColor || '#008069' }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 500 }}>
                    Click or drag screenshot to this area to upload
                  </p>
                  <p className="ant-upload-hint" style={{ fontSize: 12, color: '#8c8c8c' }}>
                    Please upload the payment confirmation receipt. Support for a single image upload.
                  </p>
                </>
              )}
            </Upload.Dragger>
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading || isUploading}
            block
            size="large"
            disabled={!bankDetails?.upiId}
            style={{
              height: 48,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #00A884 0%, #008069 100%)',
              border: 'none',
            }}
          >
            Submit Credit Request
          </Button>
        </Form>
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
