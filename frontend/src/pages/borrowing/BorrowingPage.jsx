import React, { useEffect, useState } from "react";
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
  Form,
  Modal,
  Select,
  DatePicker,
  Divider,
} from "antd";

import {
  BookOutlined,
  WarningOutlined,
  WalletOutlined,
  FilterOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  PrinterOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import { request } from "../../utils/request";

const { Search } = Input;
const { TextArea } = Input;

const avatarColors = ["#f56a00", "#7265e6", "#00a2ae", "#87d068", "#1890ff"];

const getAvatarColor = (name = "") => {
  const code = name.charCodeAt(0) || 0;
  return avatarColors[code % avatarColors.length];
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const BorrowingPage = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form] = Form.useForm();

  // ---------- Invoice Modal state ---------- //
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  const getBorrowings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText.trim()) params.append("search", searchText.trim());
      if (filterMode === "overdue") params.append("status", "overdue");

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await request(`borrowings${query}`, "get");

      let list = Array.isArray(res?.list)
        ? res.list
        : Array.isArray(res?.data)
          ? res.data
          : [];

      if (filterMode === "unpaid") {
        list = list.filter((b) => b.fine && b.fine.status === "unpaid");
      }

      setBorrowings(list);
      setTotal(res?.total ?? list.length);
    } catch (err) {
      console.error("Get borrowings error:", err);
      message.error(
        err?.response?.data?.message || "Failed to load borrowings",
      );
    } finally {
      setLoading(false);
    }
  };

  const getBooks = async () => {
    setBooksLoading(true);
    try {
      const res = await request("books", "get");
      const list = Array.isArray(res?.list)
        ? res.list
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setBooks(list);
    } catch (err) {
      console.error("Get books error:", err);
      message.error(err?.response?.data?.message || "Failed to load books");
    } finally {
      setBooksLoading(false);
    }
  };

  useEffect(() => {
    getBorrowings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, filterMode]);

  useEffect(() => {
    getBooks();
  }, []);

  const showModal = () => {
    form.resetFields();
    form.setFieldsValue({
      borrow_date: dayjs(),
      due_date: dayjs().add(7, "day"),
    });
    setOpen(true);
    F;
  };

  const handleCancel = () => {
    if (submitLoading) return;
    setOpen(false);
    form.resetFields();
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const memberPayload = {
        name: values.member_name,
        phone: values.phone || "",
        // email: values.email || "",
        address: values.address || "",
      };

      const memberResponse = await request("members", "post", memberPayload);

      const member = memberResponse?.data?.id
        ? memberResponse.data
        : memberResponse?.member?.id
          ? memberResponse.member
          : memberResponse?.id
            ? memberResponse
            : null;

      if (!member?.id) {
        throw new Error("Member was created but member ID was not returned.");
      }

      const borrowingPayload = {
        member_id: member.id,
        book_id: values.book_id,
        borrow_date: values.borrow_date.format("YYYY-MM-DD"),
        due_date: values.due_date.format("YYYY-MM-DD"),
      };

      const borrowingResponse = await request(
        "borrowings",
        "post",
        borrowingPayload,
      );
      const borrowing = borrowingResponse?.data?.id
        ? borrowingResponse.data
        : borrowingResponse;

      message.success("Member and borrowing created successfully");

      const selectedBook = books.find((b) => b.id === values.book_id);

      setInvoiceData({
        invoiceNo: borrowing?.id
          ? `INV-${String(borrowing.id).padStart(5, "0")}`
          : `INV-${Date.now()}`,
        memberName: member.name,
        memberPhone: member.phone || "-",
        // memberEmail: member.email || "-",
        memberAddress: member.address || "-",
        bookTitle: selectedBook?.title || "-",
        bookIsbn: selectedBook?.isbn || "-",
        borrowDate: values.borrow_date.format("YYYY-MM-DD"),
        dueDate: values.due_date.format("YYYY-MM-DD"),
        issuedAt: dayjs().format("YYYY-MM-DD HH:mm"),
      });

      setOpen(false);
      form.resetFields();
      setInvoiceOpen(true);
      setLoading();
      await getBorrowings();
      await getBooks();
    } catch (err) {
      console.error("Create member + borrowing error:", err);
      if (err?.errorFields) return;
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create member and borrowing",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!invoiceData) return;
    const printWindow = window.open("", "_blank", "width=800,height=900");

    printWindow.document.write(
      "<html><head><title>" +
        invoiceData.invoiceNo +
        "</title>" +
        "<style>" +
        "body{font-family:-apple-system,'Segoe UI',Arial,sans-serif;padding:40px;color:#1a1a2e;}" +
        ".header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a1a2e;padding-bottom:16px;margin-bottom:24px;}" +
        ".header h1{margin:0;font-size:22px;}" +
        ".header p{margin:4px 0 0;color:#666;font-size:13px;}" +
        ".invoice-no{text-align:right;font-size:13px;color:#666;}" +
        ".section{margin-bottom:20px;}" +
        ".section h3{font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px;}" +
        "table{width:100%;border-collapse:collapse;}" +
        "td{padding:6px 0;font-size:14px;vertical-align:top;}" +
        "td.label{width:160px;color:#666;}" +
        ".footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;}" +
        "@media print{body{padding:20px;}}" +
        "</style></head><body>" +
        "<div class='header'><div><h1>Library Management System</h1><p>Book Borrowing Invoice</p></div>" +
        "<div class='invoice-no'><div><strong>" +
        invoiceData.invoiceNo +
        "</strong></div><div>" +
        invoiceData.issuedAt +
        "</div></div></div>" +
        "<div class='section'><h3>Member Information</h3><table>" +
        "<tr><td class='label'>Name</td><td>" +
        invoiceData.memberName +
        "</td></tr>" +
        "<tr><td class='label'>Phone</td><td>" +
        invoiceData.memberPhone +
        "</td></tr>" +
        // "<tr><td class='label'>Email</td><td>" +
        // invoiceData.memberEmail +
        // "</td></tr>" +
        "<tr><td class='label'>Address</td><td>" +
        invoiceData.memberAddress +
        "</td></tr>" +
        "</table></div>" +
        "<div class='section'><h3>Borrowing Details</h3><table>" +
        "<tr><td class='label'>Book Title</td><td>" +
        invoiceData.bookTitle +
        "</td></tr>" +
        "<tr><td class='label'>ISBN</td><td>" +
        invoiceData.bookIsbn +
        "</td></tr>" +
        "<tr><td class='label'>Borrow Date</td><td>" +
        invoiceData.borrowDate +
        "</td></tr>" +
        "<tr><td class='label'>Due Date</td><td>" +
        invoiceData.dueDate +
        "</td></tr>" +
        "</table></div>" +
        "<div class='footer'>Please return the book by the due date to avoid late fines.</div>" +
        "</body></html>",
    );

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const handleMarkReturned = async (id) => {
    try {
      const res = await request(`borrowings/${id}/return`, "post");
      message.success(res?.message || "Book returned successfully");
      await getBorrowings();
    } catch (err) {
      console.error("Return book error:", err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to return book");
    }
  };

  const handleProcessFine = async (record) => {
    if (!record?.fine?.id) {
      message.error("No fine record found for this borrowing");
      return;
    }
    try {
      const res = await request(`fines/${record.fine.id}`, "put", {
        amount: record.fine.amount,
        status: "paid",
      });
      message.success(res?.message || "Fine marked as paid");
      await getBorrowings();
    } catch (err) {
      console.error("Process fine error:", err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to process fine");
    }
  };

  const activeCount = borrowings.filter((b) => b.status === "borrowed").length;
  const overdueCount = borrowings.filter((b) => b.status === "overdue").length;
  const totalUnpaidFines = borrowings
    .filter((b) => b.fine && b.fine.status === "unpaid")
    .reduce((sum, b) => sum + Number(b.fine.amount || 0), 0);

  const columns = [
    {
      title: "Member",
      dataIndex: "member",
      key: "member",
      render: (member) => {
        if (!member) return "-";
        return (
          <Space>
            <Avatar style={{ backgroundColor: getAvatarColor(member.name) }}>
              {getInitials(member.name)}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{member.name}</div>
              <div style={{ color: "#888", fontSize: 12 }}>ID: {member.id}</div>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Book",
      dataIndex: "book",
      key: "book",
      render: (book) => <strong>{book?.title || "-"}</strong>,
    },
    { title: "Borrow Date", dataIndex: "borrow_date", key: "borrow_date" },
    {
      title: "Return Date",
      dataIndex: "return_date",
      key: "return_date",
      render: (date, record) => {
        if (date) return date;
        return (
          <span
            style={{
              color: record.status === "overdue" ? "#cf1322" : undefined,
            }}
          >
            {record.due_date || "-"}
          </span>
        );
      },
    },
    {
      title: "Status / Fine",
      key: "status_fine",
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          {record.status === "overdue" && <Tag color="orange">Overdue</Tag>}
          {record.status === "borrowed" && <Tag color="blue">Borrowed</Tag>}
          {record.status === "returned" && <Tag color="default">Returned</Tag>}
          {record.status === "lost" && <Tag color="red">Lost</Tag>}
          {record.fine && Number(record.fine.amount) > 0 && (
            <span
              style={{
                color: record.fine.status === "unpaid" ? "#cf1322" : "#3f8600",
                fontWeight: 500,
              }}
            >
              ${Number(record.fine.amount).toFixed(2)}{" "}
              {record.fine.status === "unpaid" ? "Unpaid" : "Paid"}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "right",
      render: (_, record) => {
        const hasUnpaidFine = record.fine && record.fine.status === "unpaid";

        if (hasUnpaidFine) {
          return (
            <Popconfirm
              title="Mark this fine as paid?"
              description="Are you sure you received this payment?"
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleProcessFine(record)}
            >
              <Button type="primary">PROCESS FINE</Button>
            </Popconfirm>
          );
        }

        if (record.status === "borrowed" || record.status === "overdue") {
          return (
            <Popconfirm
              title="Mark this book as returned?"
              description="This will mark the borrowing as returned."
              okText="Yes"
              cancelText="No"
              onConfirm={() => handleMarkReturned(record.id)}
            >
              <Button type="link" icon={<CheckCircleOutlined />}>
                Mark Returned
              </Button>
            </Popconfirm>
          );
        }

        return null;
      },
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 0 }}>Borrowing, Repayment and fine</h2>
      <p style={{ color: "#888", marginTop: 4, marginBottom: 16 }}>
        Manage active borrowings, overdue items, and pending fines across the
        system.
      </p>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Active Borrowings"
              value={activeCount}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Overdue Items"
              value={overdueCount}
              styles={{ content: { color: "#cf1322" } }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Unpaid Fines"
              value={totalUnpaidFines}
              precision={2}
              prefix={<WalletOutlined />}
              formatter={(value) => `$${value}`}
            />
          </Card>
        </Col>
      </Row>

      <Row
        justify="space-between"
        align="middle"
        gutter={[16, 16]}
        style={{ marginBottom: 16 }}
      >
        <Col>
          <Space wrap>
            <Button
              // color="default"
              // variant="solid"
              type={filterMode === "all" ? "primary" : "default"}
              onClick={() => setFilterMode("all")}
            >
              All Records
            </Button>
            <Button
              icon={<FilterOutlined />}
              type={filterMode === "overdue" ? "primary" : "default"}
              onClick={() => setFilterMode("overdue")}
            >
              Overdue
            </Button>
            <Button
              icon={<WalletOutlined />}
              type={filterMode === "unpaid" ? "primary" : "default"}
              onClick={() => setFilterMode("unpaid")}
            >
              Unpaid Fines
            </Button>
          </Space>
        </Col>

        <Col>
          <Space>
            <Search
              placeholder="Search member or book..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => setSearchText(value)}
              style={{ width: 260 }}
            />
            <Button
              color="default"
              variant="solid"
              type="primary"
              icon={<UserAddOutlined />}
              onClick={showModal}
            >
              Add Member & Borrow
            </Button>
          </Space>
        </Col>
      </Row>

      <Modal
        open={open}
        title="Create Member & Borrowing"
        onCancel={handleCancel}
        onOk={handleCreate}
        confirmLoading={submitLoading}
        destroyOnHidden
        width={700}
        okText="Create"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Divider orientation="left">Member Information</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Member Name"
                name="member_name"
                rules={[
                  { required: true, message: "Please enter member name" },
                  { min: 2, message: "Name must be at least 2 characters" },
                ]}
              >
                <Input placeholder="Enter member name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            {/* <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col> */}
            <Col span={12}>
              <Form.Item label="Address" name="address">
                <TextArea rows={1} placeholder="Enter address" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Borrowing Information</Divider>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Book"
                name="book_id"
                rules={[{ required: true, message: "Please select a book" }]}
              >
                <Select
                  showSearch
                  loading={booksLoading}
                  placeholder="Select a book"
                  optionFilterProp="label"
                  options={books.map((book) => ({
                    value: book.id,
                    label: `${book.title || "Untitled"}${book.isbn ? ` - ${book.isbn}` : ""}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Borrow Date"
                name="borrow_date"
                rules={[
                  { required: true, message: "Please select borrow date" },
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Due Date"
                name="due_date"
                dependencies={["borrow_date"]}
                rules={[
                  { required: true, message: "Please select due date" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const borrowDate = getFieldValue("borrow_date");
                      if (!value || !borrowDate) return Promise.resolve();
                      if (value.isBefore(borrowDate, "day")) {
                        return Promise.reject(
                          new Error("Due date cannot be before borrow date"),
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={invoiceOpen}
        title="Borrowing Invoice"
        onCancel={() => setInvoiceOpen(false)}
        width={500}
        footer={[
          <Button key="close" onClick={() => setInvoiceOpen(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintInvoice}
          >
            Print Invoice
          </Button>,
        ]}
      >
        {invoiceData && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                borderBottom: "1px solid #eee",
                paddingBottom: 12,
                marginBottom: 12,
              }}
            >
              <strong>{invoiceData.invoiceNo}</strong>
              <span style={{ color: "#888", fontSize: 12 }}>
                {invoiceData.issuedAt}
              </span>
            </div>

            <p style={{ margin: "4px 0" }}>
              <strong>Member:</strong> {invoiceData.memberName}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Phone:</strong> {invoiceData.memberPhone}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Book:</strong> {invoiceData.bookTitle}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Borrow Date:</strong> {invoiceData.borrowDate}
            </p>
            <p style={{ margin: "4px 0" }}>
              <strong>Due Date:</strong> {invoiceData.dueDate}
            </p>
          </div>
        )}
      </Modal>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={borrowings}
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          pageSize: 10,
          total: total,
          showTotal: (t, range) =>
            `Showing ${range[0]} to ${range[1]} of ${t} entries`,
        }}
      />
      <div></div>
    </div>
  );
};

export default BorrowingPage;
