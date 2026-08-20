import React, { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Modal,
  Space,
  message,
  Table,
  Popconfirm,
  Tag,
  Spin,
  Tabs,
  DatePicker,
  TimePicker,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { request } from "../../utils/request";

const { Search } = Input;

const borrowingStatusColor = {
  borrowed: "blue",
  returned: "green",
  overdue: "red",
  lost: "default",
};

const purposeColor = {
  reading: "blue",
  study: "purple",
  research: "gold",
  other: "default",
};

const MemberPage = () => {
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const nameInputRef = useRef(null);
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);

  // ===== Visit / Reading log state =====
  const [visits, setVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitForm] = Form.useForm();
  const [visitSubmitLoading, setVisitSubmitLoading] = useState(false);
  const [books, setBooks] = useState([]);

  useEffect(() => {
    getMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter]);

  const getMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (statusFilter) params.append("status", statusFilter);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await request(`members${query}`, "get");
      setMembers(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchText("");
    setStatusFilter(undefined);
  };

  const showModal = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      address: record.address,
      status: record.status,
    });
    setOpen(true);
  };

  const showViewModal = async (record) => {
    setViewOpen(true);
    setViewingMember(null);
    setViewLoading(true);
    try {
      const res = await request(`members/${record.id}`, "get");
      setViewingMember(res);
      await getVisits(record.id);
    } catch (err) {
      console.error(err);
      message.error("Failed to load member details");
      setViewingMember(record);
    } finally {
      setViewLoading(false);
    }
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
        await request(`members/${editingId}`, "put", values);
        message.success("Member updated successfully");
      } else {
        await request("members", "post", values);
        message.success("Member added successfully");
      }

      setOpen(false);
      setEditingId(null);
      form.resetFields();

      await getMembers();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message ||
          (editingId ? "Failed to update member" : "Failed to add member"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await request(`members/${id}`, "delete");
      message.success(res?.message || "Member deleted successfully");
      await getMembers();
    } catch (err) {
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to delete member");
    }
  };

  // ===== Visit / Reading log handlers =====
  const getVisits = async (memberId) => {
    setVisitsLoading(true);
    try {
      const res = await request(`members/${memberId}/visits`, "get");
      setVisits(res.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setVisitsLoading(false);
    }
  };

  const openVisitModal = async () => {
    visitForm.resetFields();
    visitForm.setFieldsValue({
      visit_date: dayjs(),
      purpose: "reading",
    });
    setVisitModalOpen(true);

    // ទាញ book list សម្រាប់ Select (ធ្វើតែពេលចាំបាច់)
    if (books.length === 0) {
      try {
        const res = await request("books?per_page=1000", "get");
        setBooks(res.list || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVisitCancel = () => {
    setVisitModalOpen(false);
    visitForm.resetFields();
  };

  const handleVisitOk = async () => {
    try {
      const values = await visitForm.validateFields();
      setVisitSubmitLoading(true);

      const payload = {
        ...values,
        visit_date: values.visit_date.format("YYYY-MM-DD"),
        check_in_time: values.check_in_time
          ? values.check_in_time.format("HH:mm")
          : null,
        check_out_time: values.check_out_time
          ? values.check_out_time.format("HH:mm")
          : null,
      };

      await request(`members/${viewingMember.id}/visits`, "post", payload);
      message.success("Visit recorded successfully");

      setVisitModalOpen(false);
      visitForm.resetFields();
      await getVisits(viewingMember.id);
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to record visit");
    } finally {
      setVisitSubmitLoading(false);
    }
  };

  const handleDeleteVisit = async (visitId) => {
    try {
      await request(`visits/${visitId}`, "delete");
      message.success("Visit record deleted");
      await getVisits(viewingMember.id);
    } catch (err) {
      console.error(err);
      message.error("Failed to delete visit record");
    }
  };

  const columns = [
    { title: "Member Code", dataIndex: "member_code", key: "member_code" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Address", dataIndex: "address", key: "address", ellipsis: true },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Active" : "Suspended"}
        </Tag>
      ),
    },
    {
      title: "Borrowings",
      dataIndex: "borrowings_count",
      key: "borrowings_count",
      render: (count) => (count ? count : "None"),
    },
    {
      title: "Actions",
      key: "action",
      align: "center",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showViewModal(record)}
          />
          <Popconfirm
            title="Delete this member?"
            description="This action cannot be undone."
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

  const borrowingColumns = [
    {
      title: "Book",
      dataIndex: ["book", "title"],
      key: "book",
      render: (title) => title || "-",
    },
    { title: "Borrow Date", dataIndex: "borrow_date", key: "borrow_date" },
    {
      title: "Due / Return",
      key: "date",
      render: (_, record) =>
        record.return_date
          ? `Returned: ${record.return_date}`
          : `Due: ${record.due_date}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={borrowingStatusColor[status] || "default"}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Fine",
      dataIndex: "fine_amount",
      key: "fine_amount",
      render: (amount) =>
        Number(amount) > 0 ? `$${Number(amount).toFixed(2)}` : "-",
    },
  ];

  const visitColumns = [
    { title: "Date", dataIndex: "visit_date", key: "visit_date" },
    {
      title: "Book",
      key: "book",
      render: (_, record) => record.book?.title || "In-library reading",
    },
    {
      title: "Time",
      key: "time",
      render: (_, record) =>
        record.check_in_time
          ? `${record.check_in_time}${
              record.check_out_time ? " - " + record.check_out_time : ""
            }`
          : "-",
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      render: (p) => (
        <Tag color={purposeColor[p] || "default"}>
          {p?.charAt(0).toUpperCase() + p?.slice(1)}
        </Tag>
      ),
    },
    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this visit record?"
          okText="Yes"
          cancelText="No"
          onConfirm={() => handleDeleteVisit(record.id)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Select
              placeholder="Filter by status"
              allowClear
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              style={{ width: 160 }}
              options={[
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
              ]}
            />
            {(searchText || statusFilter) && (
              <Button onClick={handleResetFilters}>Clear Filters</Button>
            )}
          </Space>
        </Col>
        <Col>
          <Space>
            <Search
              placeholder="Search by name or code..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(v) => setSearchText(v)}
              style={{ width: 260 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
              Add Member
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={members}
        loading={loading}
        bordered
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          showTotal: (t, range) =>
            `Showing ${range[0]} to ${range[1]} of ${t} members`,
        }}
      />

      {/* ===== Add / Edit Member Modal ===== */}
      <Modal
        open={open}
        title={editingId ? "Edit Member" : "Add Member"}
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
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          initialValues={{ status: "active" }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input ref={nameInputRef} placeholder="e.g. Sok San" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="e.g. +855 12 345 678" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="e.g. 123 St 456, Toul Kork, Phnom Penh" />
          </Form.Item>
          {editingId && (
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Status is required" }]}
            >
              <Select
                options={[
                  { label: "Active", value: "active" },
                  { label: "Suspended", value: "suspended" },
                ]}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ===== View Member Modal (with Borrowing + Visit tabs) ===== */}
      <Modal
        open={viewOpen}
        title="Member Details"
        onCancel={() => setViewOpen(false)}
        width={750}
        footer={[
          <Button key="close" onClick={() => setViewOpen(false)}>
            Close
          </Button>,
        ]}
      >
        {viewLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          viewingMember && (
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div>
                <strong>Member Code:</strong> {viewingMember.member_code}
              </div>
              <div>
                <strong>Name:</strong> {viewingMember.name}
              </div>
              <div>
                <strong>Phone:</strong> {viewingMember.phone || "-"}
              </div>
              <div>
                <strong>Address:</strong> {viewingMember.address || "-"}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <Tag
                  color={viewingMember.status === "active" ? "green" : "red"}
                >
                  {viewingMember.status === "active" ? "Active" : "Suspended"}
                </Tag>
              </div>

              <Tabs
                defaultActiveKey="borrowing"
                items={[
                  {
                    key: "borrowing",
                    label: `Borrowing History (${viewingMember.borrowings?.length || 0})`,
                    children: (
                      <Table
                        size="small"
                        rowKey="id"
                        dataSource={viewingMember.borrowings || []}
                        columns={borrowingColumns}
                        pagination={false}
                        locale={{ emptyText: "No borrowing history yet" }}
                      />
                    ),
                  },
                  {
                    key: "visits",
                    label: `Visit / Reading Log (${visits.length})`,
                    children: (
                      <>
                        <div style={{ textAlign: "right", marginBottom: 8 }}>
                          <Button
                            size="small"
                            type="primary"
                            icon={<BookOutlined />}
                            onClick={openVisitModal}
                          >
                            Record Visit
                          </Button>
                        </div>
                        <Table
                          size="small"
                          rowKey="id"
                          dataSource={visits}
                          columns={visitColumns}
                          loading={visitsLoading}
                          pagination={{ pageSize: 5 }}
                          locale={{
                            emptyText: (
                              <Empty description="No visit records yet" />
                            ),
                          }}
                        />
                      </>
                    ),
                  },
                ]}
              />
            </Space>
          )
        )}
      </Modal>

      {/* ===== Record Visit Modal ===== */}
      <Modal
        open={visitModalOpen}
        title="Record Library Visit"
        onOk={handleVisitOk}
        onCancel={handleVisitCancel}
        footer={[
          <Button key="back" onClick={handleVisitCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={visitSubmitLoading}
            onClick={handleVisitOk}
          >
            Save
          </Button>,
        ]}
      >
        <Form form={visitForm} layout="vertical" requiredMark="optional">
          <Form.Item
            name="visit_date"
            label="Visit Date"
            rules={[{ required: true, message: "Visit date is required" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item
            name="book_id"
            label="Book (optional — in-library reading)"
          >
            <Select
              showSearch
              allowClear
              placeholder="Select a book, if reading a specific title"
              optionFilterProp="label"
              options={books.map((b) => ({ label: b.title, value: b.id }))}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="check_in_time" label="Check-in Time">
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="check_out_time" label="Check-out Time">
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: "Purpose is required" }]}
          >
            <Select
              options={[
                { label: "Reading", value: "reading" },
                { label: "Study", value: "study" },
                { label: "Research", value: "research" },
                { label: "Other", value: "other" },
              ]}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberPage;
