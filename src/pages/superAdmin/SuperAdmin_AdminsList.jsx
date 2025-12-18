import { useEffect, useState } from "react";
import { useAuthGuard } from "../../hooks/useAuthGuard";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Tooltip,
  Space,
  Badge,
  Tag,
} from "antd";
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  MailOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllTenants,
  createTenant,
} from "../../redux/slices/tenantSlice.jsx";

export default function SuperAdminAdminsList() {
  useAuthGuard(["SUPER_ADMIN"]);
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

  // ✅ Ensure tenants is always an array
  const tenantsArray = Array.isArray(tenants) 
    ? tenants 
    : tenants?.data?.tenants || tenants?.tenants || [];

  console.log('Tenants:', tenantsArray);


  const handleCreateAdmin = async (values) => {
    const result = await dispatch(createTenant(values));
    if (result.type === 'tenant/createTenant/fulfilled') {
      form.resetFields();
      setModalOpen(false);
    }
  };

  // ------------------------------------------
  // TABLE COLUMNS
  // ------------------------------------------
  const columns = [
    {
      title: "Admin",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <span className="font-medium text-gray-800">{name}</span>
      ),
    },
    {
      title: "Admin Email",
      dataIndex: ["admin", "email"],
      key: "email",
      render: (email) => (
        <Tag
          color="processing"
          className="px-3 py-1 text-sm rounded-full shadow-sm"
        >
          {email}
        </Tag>
      ),
    },
    {
      title: "Users",
      dataIndex: "members",
      key: "userCount",
      render: (members) => (
        <Badge count={members?.length || 0} showZero style={{ backgroundColor: "#38bdf8" }} />
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => (
        <span className="text-gray-600">
          {new Date(text).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: () => (
        <Tooltip title="Delete Workspace">
          <Button
            shape="circle"
            danger
            icon={<DeleteOutlined />}
            className="shadow hover:shadow-md transition-all"
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-white via-blue-50 to-sky-50">

      <Card
        className="rounded-3xl shadow-xl border border-blue-100 backdrop-blur-xl"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.55), rgba(245,250,255,0.65))",
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          {/* Left Header */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)",
              }}
            >
              <UserOutlined className="text-white text-xl" />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                Admin Workspaces
              </h2>
              <p className="text-sm text-gray-600">
                Manage tenant workspaces & their admins
              </p>
            </div>
          </div>

          {/* Create Button */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            className="rounded-xl shadow-lg hover:shadow-xl transition-all"
            style={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)",
            }}
            onClick={() => setModalOpen(true)}
          >
            Create Admin
          </Button>
        </div>

        {/* TABLE */}
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={tenantsArray}
          loading={loading}
          pagination={{ pageSize: 10 }}
          className="rounded-2xl bg-white border border-gray-200 shadow-sm"
        />
      </Card>

      {/* MODAL */}
      <Modal
        title={
          <div className="text-lg font-semibold bg-gradient-to-r from-sky-500 to-blue-500 text-white px-4 py-2 rounded-md shadow">
            Create New Admin
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        className="rounded-xl"
        centered
      >
        <Form layout="vertical" form={form} onFinish={handleCreateAdmin}>
          <Form.Item
            name="name"
            label="Admin Name"
            rules={[{ required: true, message: "Please enter workspace name" }]}
          >
            <Input size="large" placeholder="Ex: Marketing HQ" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Admin Email"
            rules={[
              { required: true, message: "Please enter admin email" },
              { type: "email", message: "Invalid email address" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="admin@example.com"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Admin Password"
            rules={[
              { required: true, message: "Please enter admin password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
            initialValue="Admin@123"
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Enter admin password"
            />
          </Form.Item>

          <Space className="mt-4">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="rounded-lg px-6 shadow-md"
              style={{
                background:
                  "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)",
              }}
            >
              Create
            </Button>

            <Button size="large" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
