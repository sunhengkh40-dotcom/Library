import React, { useEffect, useRef, useState } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Input,
  Table,
  Tag,
  Avatar,
  Space,
  message,
  Popconfirm,
  Modal,
  Form,
  Select,
  InputNumber,
} from "antd";
import {
  WalletOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";

import { request } from "../../utils/request";

const { Search } = Input;

const avatarColors = ["#f56a00", "#7265e6", "#00a2ae", "#87d068", "#1890ff"];
const getAvatarColor = (name = "") => {
  const code = name.charCodeAt(0) || 0;
  return avatarColors[code % avatarColors.length];
};
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const FinePage = () => {
  const [fines, setFines] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all | unpaid | paid

  // ---------- Add / Edit modal ----------
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();
  const amountInputRef = useRef(null);

  // ---------- Borrowing dropdown (for Add Fine) ----------
  const [borrowings, setBorrowings] = useState([]);

  useEffect(() => {
    getFines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode]);

  const getFines = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMode !== "all") params.append("status", filterMode);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await request(`fines${query}`, "get");
      setFines(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBorrowings = async () => {
    try {
      const res = await request("borrowings", "get");
      setBorrowings(res.list || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Client-side search តាមឈ្មោះ Member ឬចំណងជើង Book
  // (Backend FineController@index មិនទាន់ support ?search= ដូច្នេះ filter នៅ Frontend)
  const filteredFines = fines.filter((f) => {
    if (!searchText) return true;
    const s = searchText.toLowerCase();
    const memberName = f.borrowing?.member?.name?.toLowerCase() || "";
    const bookTitle = f.borrowing?.book?.title?.toLowerCase() || "";
    return memberName.includes(s) || bookTitle.includes(s);
  });

  // ---------- Stat cards ----------
  const unpaidFines = fines.filter((f) => f.status === "unpaid");
  const paidFines = fines.filter((f) => f.status === "paid");
  const totalUnpaidAmount = unpaidFines.reduce(
    (sum, f) => sum + Number(f.amount || 0),
    0,
  );

  // ---------- Add ----------
  const showAddModal = () => {
    setEditingId(null);
    form.resetFields();
    getBorrowings();
    setOpen(true);
  };

  // ---------- Edit ----------
  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      amount: Number(record.amount),
      status: record.status,
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
        await request(`fines/${editingId}`, "put", {
          amount: values.amount,
          status: values.status,
        });
        message.success("Fine updated successfully");
      } else {
        await request("fines", "post", {
          borrowing_id: values.borrowing_id,
          amount: values.amount,
          status: values.status || "unpaid",
        });
        message.success("Fine created successfully");
      }

      setOpen(false);
      setEditingId(null);
      form.resetFields();
      await getFines();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message ||
          (editingId ? "Failed to update fine" : "Failed to create fine"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ---------- Process Fine (mark as paid) ----------
  const handleProcessFine = async (record) => {
    try {
      const res = await request(`fines/${record.id}`, "put", {
        amount: record.amount,
        status: "paid",
      });
      message.success(res?.message || "Fine marked as paid");
      await getFines();
    } catch (err) {
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to process fine");
    }
  };

  // ---------- Delete ----------
  const handleDelete = async (id) => {
    try {
      const res = await request(`fines/${id}`, "delete");
      message.success(res?.message || "Fine deleted successfully");
      await getFines();
    } catch (err) {
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to delete fine");
    }
  };

  const columns = [
    {
      title: "Member",
      key: "member",
      render: (_, record) => {
        const member = record.borrowing?.member;
        return member ? (
          <Space>
            <Avatar style={{ backgroundColor: getAvatarColor(member.name) }}>
              {getInitials(member.name)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{member.name}</div>
              <div style={{ color: "#888", fontSize: 12 }}>ID: {member.id}</div>
            </div>
          </Space>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Book",
      key: "book",
      render: (_, record) => (
        <strong>{record.borrowing?.book?.title || "-"}</strong>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `$${Number(amount).toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "unpaid" ? "red" : "green"}>
          {status === "unpaid" ? "Unpaid" : "Paid"}
        </Tag>
      ),
    },
    {
      title: "Paid Date",
      dataIndex: "paid_date",
      key: "paid_date",
      render: (date) => date || "-",
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => (
        <Space>
          {record.status === "unpaid" && (
            <Popconfirm
              title="Mark this fine as paid?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleProcessFine(record)}
            >
              <Button>PROCESS FINE</Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
          <Popconfirm
            title="Delete this fine record?"
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
      {/* ---------- Header ---------- */}
      <Row justify="space-between" align="middle">
        <Col>
          <h2 style={{ marginBottom: 0 }}>Fines</h2>
          <p style={{ color: "#888", marginTop: 4 }}>
            Track and manage overdue fines across the library system.
          </p>
        </Col>
        {/* <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
            Add Fine
          </Button>
        </Col> */}
      </Row>

      {/* ---------- Stat cards ---------- */}
      <Row gutter={16} style={{ margin: "16px 0" }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Fines"
              value={total}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Unpaid Fines"
              value={totalUnpaidAmount}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              prefix={<WarningOutlined />}
              formatter={(v) => `$${v}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Paid Fines"
              value={paidFines.length}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ---------- Filter tabs + Search ---------- */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Button
              // color="default"
              // variant="solid"
              type={filterMode === "all" ? "primary" : "default"}
              onClick={() => setFilterMode("all")}
            >
              All Records
            </Button>
            <Button
              type={filterMode === "unpaid" ? "primary" : "default"}
              onClick={() => setFilterMode("unpaid")}
            >
              Unpaid
            </Button>
            <Button
              type={filterMode === "paid" ? "primary" : "default"}
              onClick={() => setFilterMode("paid")}
            >
              Paid
            </Button>
          </Space>
        </Col>
        <Col>
          <Search
            placeholder="Search member or book..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={(v) => setSearchText(v)}
            style={{ width: 260 }}
          />
        </Col>
      </Row>

      {/* ---------- Table ---------- */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredFines}
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (t, range) =>
            `Showing ${range[0]} to ${range[1]} of ${t} entries`,
        }}
      />

      {/* ---------- Add / Edit Modal ---------- */}
      <Modal
        open={open}
        title={editingId ? "Edit Fine" : "Add Fine"}
        onOk={handleOk}
        onCancel={handleCancel}
        afterOpenChange={(isOpen) => {
          if (isOpen) amountInputRef.current?.focus();
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
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          initialValues={{ status: "unpaid" }}
        >
          {!editingId && (
            <Form.Item
              name="borrowing_id"
              label="Borrowing Record"
              rules={[{ required: true, message: "Please select a borrowing" }]}
            >
              <Select
                placeholder="Select borrowing record"
                showSearch
                optionFilterProp="label"
                options={borrowings.map((b) => ({
                  label: `${b.member?.name || "Unknown"} — ${b.book?.title || "Unknown"}`,
                  value: b.id,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="amount"
            label="Amount ($)"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber
              ref={amountInputRef}
              min={0}
              step={0.5}
              style={{ width: "100%" }}
              placeholder="e.g. 2.50"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select
              options={[
                { label: "Unpaid", value: "unpaid" },
                { label: "Paid", value: "paid" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinePage;
