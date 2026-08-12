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
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import { request } from "../../utils/request";

const { Search } = Input;

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const nameInputRef = useRef(null);

  useEffect(() => {
    getCategories();
  }, [searchText]);

  const getCategories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await request(`categories${query}`, "get");
      // const res = await request("categories" , "get")
      setCategories(res.list || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const slugify = (text = "") =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const showAddModal = () => {
    setEditingId(null);
    form.resetFields();
    setOpen(true);
  };

  const showEditModal = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({ name: record.name, slug: record.slug });
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

      const payload = {
        name: values.name,
        slug: values.slug || slugify(values.name),
      };

      const isEdit = Boolean(editingId);
      if (isEdit) {
        await request(`categories/${editingId}`, "put", payload);
        message.success("Category updated successfully");
      } else {
        await request("categories", "post", payload);
        message.success("Category created successfully");
      }

      setOpen(false);
      setEditingId(null);
      form.resetFields();
      await getCategories();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message ||
          (editingId
            ? "Failed to update category"
            : "Failed to create category"),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await request(`categories/${id}`, "delete");
      message.success(res?.message || "Category deleted successfully");
      await getCategories();
    } catch (err) {
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message || "Cannot delete this category",
      );
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 70 },
    { title: "Name", dataIndex: "name" },
    { title: "Slug", dataIndex: "slug", render: (s) => <Tag>{s}</Tag> },
    { title: "Books", dataIndex: "books_count", width: 100 },
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
            title="Delete this category?"
            description="Books linked to this category must be reassigned first."
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
          <h2 style={{ marginBottom: 0 }}>Categories</h2>
          <p style={{ color: "#888", marginTop: 4 }}>
            Manage book categories used across the library catalog.
          </p>
        </Col>
        <Col>
          <Button
            color="default"
            variant="solid"
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            Add Category
          </Button>
        </Col>
      </Row>

      <Row justify="end" style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search category name..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={(v) => setSearchText(v)}
          style={{ width: 260 }}
        />
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={categories}
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (t, range) =>
            `Showing ${range[0]} to ${range[1]} of ${t} categories`,
        }}
      />

      <Modal
        open={open}
        title={editingId ? "Edit Category" : "Add Category"}
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
            <Input ref={nameInputRef} placeholder="e.g. Technology" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            extra="Leave blank to auto-generate from name"
          >
            <Input placeholder="e.g. technology" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryPage;
