import React, { useEffect, useRef, useState } from "react";
import {
  Row,
  Col,
  Button,
  Input,
  Table,
  Space,
  message,
  Popconfirm,
  Modal,
  Form,
  Select,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// ⚠️ ត្រូវប្តូរ path នេះតាម folder depth ជាក់ស្តែងរបស់ File នេះ
import { request } from "../../utils/request";

const { Search } = Input;

const roleColors = {
  admin: "red",
  librarian: "blue",
  member: "default",
};

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState(undefined);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const nameInputRef = useRef(null);

  useEffect(() => {
    getUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, roleFilter]);

  const getUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (roleFilter) params.append("role", roleFilter);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await request(`users${query}`, "get");
      setUsers(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const isEdit = Boolean(editingId);

      if (isEdit) {
        const payload = {
          name: values.name,
          email: values.email,
          role: values.role,
        };
        if (values.password) {
          payload.password = values.password;
          payload.password_confirmation = values.password_confirmation;
        }
        await request(`users/${editingId}`, "put", payload);
        message.success("User updated successfully");
      } else {
        await request("users", "post", {
          name: values.name,
          email: values.email,
          role: values.role,
          password: values.password,
          password_confirmation: values.password_confirmation,
        });
        message.success("User created successfully");
      }

      setOpen(false);
      setEditingId(null);
      form.resetFields();
      await getUsers();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message ||
          (editingId ? "Failed to update user" : "Failed to create user"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await request(`users/${id}`, "delete");
      message.success(res?.message || "User deleted successfully");
      await getUsers();
    } catch (err) {
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const columns = [
    // { title: "ID", dataIndex: "id", width: 60 },
    { title: "Name", dataIndex: "name" },
    { title: "Email", dataIndex: "email" },
    {
      title: "Role",
      dataIndex: "role",
      render: (role) => <Tag color={roleColors[role]}>{role}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      width: 110,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="Delete this user?"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2 style={{ marginBottom: 0 }}>Users</h2>
          <p style={{ color: "#888", marginTop: 4 }}>
            Manage system accounts and roles (Admin, Librarian, Member).
          </p>
        </Col>
        <Col>
          <Button
            color="default"
            variant="solid"
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            Add User
          </Button>
        </Col>
      </Row>

      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="Filter by role"
            allowClear
            value={roleFilter}
            onChange={(v) => setRoleFilter(v)}
            style={{ width: 180 }}
            options={[
              { label: "Admin", value: "admin" },
              { label: "Librarian", value: "librarian" },
              // { label: "Member", value: "member" },
            ]}
          />
        </Col>
        <Col>
          <Search
            placeholder="Search name or email..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v)}
            style={{ width: 260 }}
          />
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (t, range) =>
            `Showing ${range[0]} to ${range[1]} of ${t} users`,
        }}
      />

      <Modal
        open={open}
        title={editingId ? "Edit User" : "Add User"}
        onOk={handleOk}
        onCancel={handleCancel}
        afterOpenChange={(isOpen) => {
          if (isOpen) nameInputRef.current?.focus();
        }}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitLoading}
            onClick={handleOk}
          >
            {editingId ? "Update" : "Submit"}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input ref={nameInputRef} placeholder="e.g. Sok San" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input placeholder="e.g. user@library.com" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select
              placeholder="Select role"
              options={[
                { label: "Admin", value: "admin" },
                { label: "Librarian", value: "librarian" },
                // { label: "Member", value: "member" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              editingId
                ? "New Password (leave blank to keep current)"
                : "Password"
            }
            rules={
              editingId
                ? []
                : [{ required: true, message: "Password is required" }]
            }
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="password_confirmation"
            label="Confirm Password"
            dependencies={["password"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const pwd = getFieldValue("password");
                  if (!pwd && !value) return Promise.resolve();
                  if (pwd === value) return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserPage;
