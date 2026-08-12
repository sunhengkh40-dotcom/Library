import React, { useEffect, useRef, useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Button,
  Row,
  Col,
  Modal,
  Space,
  message,
  Table,
  Popconfirm,
  Tag,
  Progress,
  Card,
  Statistic,
} from "antd";
import dayjs from "dayjs";
import styles from "../bookInventory/BookInventory.module.css";
import {
  PlusOutlined,
  UploadOutlined,
  DeleteOutlined,
  EditOutlined,
  BookOutlined,
  DatabaseOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { request } from "../../utils/request";

const { Search } = Input;
const { TextArea } = Input;

const BookInventoryPage = () => {
  const [books, setBooks] = useState([]);
  const [total, setTotal] = useState(0); // ✅ ចំនួន Book Title សរុប (ពី Backend Pagination)

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const titleInputRef = useRef(null);
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(undefined);

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    getBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, categoryFilter]);

  const getBooks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (categoryFilter) params.append("category_id", categoryFilter);
      
      params.append("per_page", 1000);

      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await request(`books${query}`, "get");
      setBooks(res.list);
      setTotal(res.total || res.list.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCategories = async () => {
    try {
      const res = await request("categories", "get");
      setCategories(res.list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetFilters = () => {
    setSearchText("");
    setCategoryFilter(undefined);
  };

  const showModal = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      isbn: record.isbn,
      title: record.title,
      author: record.author,
      category_id: record.category_id,
      publisher: record.publisher,
      published_year: record.published_year
        ? dayjs(String(record.published_year), "YYYY")
        : null,
      total_copies: record.total_copies,
      description: record.description,
      image: record.cover_image
        ? [
            {
              uid: "-1",
              name: "cover.jpg",
              status: "done",
              url: `http://localhost:8000/storage/${record.cover_image}`,
            },
          ]
        : [],
    });
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  const buildFormData = (values) => {
    const formData = new FormData();
    formData.append("isbn", values.isbn);
    formData.append("title", values.title);
    formData.append("author", values.author);
    formData.append("category_id", values.category_id);
    formData.append("publisher", values.publisher || "");
    formData.append("description", values.description || "");

    if (values.published_year) {
      formData.append("published_year", values.published_year.format("YYYY"));
    }

    formData.append("total_copies", values.total_copies);

    if (values.image?.[0]?.originFileObj) {
      formData.append("image", values.image[0].originFileObj);
    }

    return formData;
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);

      const formData = buildFormData(values);
      const isEdit = Boolean(editingId);

      if (isEdit) {
        formData.append("_method", "PUT");
        await request(`books/${editingId}`, "post", formData);
        message.success("Book updated successfully");
      } else {
        await request("books", "post", formData);
        message.success("Book added successfully");
      }

      setOpen(false);
      setEditingId(null);
      form.resetFields();

      await getBooks();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message ||
          (editingId ? "Failed to update book" : "Failed to add book"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await request(`books/${id}`, "delete");
      message.success(res?.message || "Book deleted successfully");
      await getBooks();
    } catch (err) {
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to delete book");
    }
  };

  // ---------- Stat Card គណនាពី books ដែលទាញបានស្រាប់ ----------
  const totalCopies = books.reduce((sum, b) => sum + (b.total_copies || 0), 0);
  const outOfStockCount = books.filter((b) => b.available_copies === 0).length;
  const lowStockCount = books.filter(
    (b) => b.available_copies > 0 && b.available_copies <= b.total_copies * 0.2,
  ).length;

  const columns = [
    {
      title: "No.",
      key: "no",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    { title: "Title", dataIndex: "title", key: "title" },
    {
      title: "Image",
      dataIndex: "cover_image",
      key: "cover_image",
      render: (path) =>
        path ? (
          <img
            src={`http://localhost:8000/storage/${path}`}
            alt="cover"
            style={{ width: 50 }}
          />
        ) : (
          "-"
        ),
    },
    { title: "Author", dataIndex: "author", key: "author" },
    { title: "Category", dataIndex: ["category", "name"], key: "category" },
    { title: "Publisher", dataIndex: "publisher", key: "publisher" },
    {
      title: "Published year",
      dataIndex: "published_year",
      key: "published_year",
    },
    {
      title: "Stock",
      key: "stock",
      width: 160,
      render: (_, record) => {
        const available = record.available_copies;
        const total = record.total_copies;
        const percent = total > 0 ? Math.round((available / total) * 100) : 0;

        let color = "green";
        let statusText = "In Stock";
        if (available === 0) {
          color = "red";
          statusText = "Out of Stock";
        } else if (available <= total * 0.2) {
          color = "orange";
          statusText = "Low Stock";
        }

        return (
          <div>
            <div style={{ marginBottom: 4 }}>
              <Tag color={color}>{statusText}</Tag>
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {available} available / {total} total
            </div>
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              strokeColor={
                color === "red"
                  ? "#cf1322"
                  : color === "orange"
                    ? "#fa8c16"
                    : "#52c41a"
              }
            />
          </div>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Space className={styles.btn}>
          <Button
            color="cyan"
            variant="filled"
            onClick={() => showEditModal(record)}
            icon={<EditOutlined />}
          ></Button>
          <Popconfirm
            title="Delete this book?"
            description="This action cannot be undone."
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              color="pink"
              variant="filled"
              icon={<DeleteOutlined />}
            ></Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row style={{ width: "100%" }}>
        <Col span={24}>
          <div className={styles.header}>
            <div>
              <h2>Books Inventory</h2>
              <p>Manage and monitor library book catalog.</p>
            </div>

            <Space style={{ marginLeft: "auto" }}>
              {(searchText || categoryFilter) && (
                <Button
                  onClick={handleResetFilters}
                  color="default"
                  variant="solid"
                >
                  Clear Filters
                </Button>
              )}
              <Search
                placeholder="Search title, author, ISBN"
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onSearch={(v) => setSearchText(v)}
                style={{ width: 240 }}
              />
              <Select
                placeholder="Filter by category"
                allowClear
                value={categoryFilter}
                onChange={(v) => setCategoryFilter(v)}
                style={{ width: 200 }}
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
              <Button
                color="default"
                variant="solid"
                icon={<PlusOutlined />}
                onClick={showModal}
              >
                Add New
              </Button>
            </Space>
          </div>

          {/* ✅ Stat Cards — ចំនួន Book ទាំងអស់ + Copies + Stock Status */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Book Titles"
                  value={total}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Copies"
                  value={totalCopies}
                  prefix={<DatabaseOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Low Stock Titles"
                  value={lowStockCount}
                  valueStyle={{ color: "#fa8c16" }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Out of Stock Titles"
                  value={outOfStockCount}
                  valueStyle={{ color: "#cf1322" }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Modal
            open={open}
            title={editingId ? "Edit Book" : "Add Book"}
            onOk={handleOk}
            onCancel={handleCancel}
            afterOpenChange={(isOpen) => {
              if (isOpen) {
                titleInputRef.current?.focus();
              }
            }}
            footer={[
              <Button key="back" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button
                key="submit"
                color="default"
                variant="solid"
                loading={submitLoading}
                onClick={handleOk}
              >
                {editingId ? "Update" : "Submit"}
              </Button>,
            ]}
          >
            <Form form={form} layout="vertical" requiredMark="optional">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="isbn"
                    rules={[{ required: true, message: "ISBN is required" }]}
                  >
                    <Input ref={titleInputRef} placeholder="Enter ISBN" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="title" rules={[{ required: true }]}>
                    <Input placeholder="Enter book title" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="author" rules={[{ required: true }]}>
                    <Input placeholder="Enter author name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="category_id" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select category"
                      options={categories.map((c) => ({
                        label: c.name,
                        value: c.id,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="publisher" rules={[{ required: true }]}>
                    <Input placeholder="Enter publisher" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="published_year" rules={[{ required: true }]}>
                    <DatePicker picker="year" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="description">
                    <TextArea
                      rows={3}
                      placeholder="Short description of the book"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="total_copies" rules={[{ required: true }]}>
                    <InputNumber
                      min={0}
                      placeholder="QTY"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="image"
                valuePropName="fileList"
                getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>
            </Form>
          </Modal>
        </Col>
        <Col span={24}>
          <Table
            className={styles.table}
            rowKey="id"
            columns={columns}
            dataSource={books}
            loading={loading}
            bordered
            scroll={{ x: 1300 }}
            pagination={{
              pageSize: 5,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

export default BookInventoryPage;
