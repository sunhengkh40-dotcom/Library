import React, { useEffect, useState } from "react";
import {
  ArrowDownOutlined,
  BookOutlined,
  DollarOutlined,
  InboxOutlined,
  SwapOutlined,
  TeamOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic, Table, Tag, Typography, Empty } from "antd";

import { request } from "../../utils/request";

const { Title, Text } = Typography;

// ===== Design tokens (matches ReportPage theme) =====
const COLORS = {
  navy: "#1B2A4A",
  navyLight: "#2E4373",
  accent: "#C08A3E",
  danger: "#B3413A",
  green: "#2E7D4F",
  bg: "#F7F5F0",
};

const statusColor = {
  borrowed: "blue",
  returned: "green",
  overdue: "red",
  lost: "default",
};

const columns = [
  {
    title: "Member",
    dataIndex: ["member", "name"],
    key: "member",
  },
  {
    title: "Book Title",
    dataIndex: ["book", "title"],
    key: "book",
  },
  {
    title: "Borrow Date",
    dataIndex: "borrow_date",
    key: "borrow_date",
  },
  {
    title: "Due Date",
    dataIndex: "due_date",
    key: "due_date",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status) => (
      <Tag color={statusColor[status] || "default"}>
        {status?.toUpperCase()}
      </Tag>
    ),
  },
];

const overdueColumns = [
  {
    title: "Member",
    dataIndex: ["member", "name"],
    key: "member",
  },
  {
    title: "Book Title",
    dataIndex: ["book", "title"],
    key: "book",
  },
  {
    title: "Due Date",
    dataIndex: "due_date",
    key: "due_date",
  },
  {
    title: "Days Late",
    key: "days_late",
    render: (_, record) => {
      const due = new Date(record.due_date);
      const today = new Date();
      const diff = Math.max(
        0,
        Math.floor(
          (today.setHours(0, 0, 0, 0) - due.setHours(0, 0, 0, 0)) / 86400000,
        ),
      );
      return (
        <Tag color="red">
          {diff} day{diff !== 1 ? "s" : ""}
        </Tag>
      );
    },
  },
];

const HomePage = () => {
  const [loading, setLoading] = useState(true);

  const [totalBook, setTotalBook] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalCopies, setTotalCopies] = useState(0);

  const [borrowing, setBorrowing] = useState([]);
  const [totalBorrowing, setTotalBorrowing] = useState(0);

  const [totalFine, setTotalFine] = useState(0);
  const [totalUnpaidFine, setTotalUnpaidFine] = useState(0);

  const [overdue, setOverdue] = useState([]);
  const [totalOverdue, setTotalOverdue] = useState(0);

  const [totalMembers, setTotalMembers] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [
        booksRes,
        borrowingsRes,
        finesRes,
        overdueRes,
        membersRes,
        categoriesRes,
      ] = await Promise.all([
        request("books?per_page=1000", "get"),
        request("borrowings?per_page=10", "get"),
        request("fines?per_page=1000", "get"),
        request("borrowings?overdue=true", "get"),
        request("members?per_page=1", "get"),
        request("categories?per_page=1", "get"),
      ]);

      // ----- Books / Stock -----
      setTotalBook(booksRes.total);
      const stockSum = booksRes.list.reduce(
        (sum, b) => sum + (b.available_copies || 0),
        0,
      );
      const copiesSum = booksRes.list.reduce(
        (sum, b) => sum + (b.total_copies || 0),
        0,
      );
      setTotalStock(stockSum);
      setTotalCopies(copiesSum);

      // ----- Borrowings -----
      setBorrowing(borrowingsRes.list);
      setTotalBorrowing(borrowingsRes.total);

      // ----- Fines -----
      setTotalFine(
        finesRes.list.reduce((sum, f) => sum + Number(f.amount || 0), 0),
      );
      setTotalUnpaidFine(
        finesRes.list
          .filter((f) => f.status === "unpaid")
          .reduce((sum, f) => sum + Number(f.amount || 0), 0),
      );

      // ----- Overdue -----
      setOverdue(overdueRes.list);
      setTotalOverdue(overdueRes.total);

      // ----- Members / Categories -----
      setTotalMembers(membersRes.total);
      setTotalCategories(categoriesRes.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{  minHeight: "100%" }}
    >
      <Title level={3} style={{ margin: 0, color: COLORS.navy }}>
        Dashboard
      </Title>
      <Text type="secondary">Overview of your library</Text>

      {/* ===== Summary Cards ===== */}
      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<BookOutlined />}
            iconBg="#EAF0FF"
            iconColor={COLORS.navyLight}
            title="Total Books"
            value={totalBook}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<InboxOutlined />}
            iconBg="#EAF0FF"
            iconColor={COLORS.navyLight}
            title="Books in Stock"
            value={totalStock}
            suffix={`/ ${totalCopies}`}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<TeamOutlined />}
            iconBg="#F3EAFF"
            iconColor="#6B3FA0"
            title="Total Members"
            value={totalMembers}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<TagsOutlined />}
            iconBg="#F3EAFF"
            iconColor="#6B3FA0"
            title="Categories"
            value={totalCategories}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<SwapOutlined />}
            iconBg="#FFF3E0"
            iconColor={COLORS.accent}
            title="Active Borrowings"
            value={totalBorrowing}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<ArrowDownOutlined />}
            iconBg="#FDECEC"
            iconColor={COLORS.danger}
            title="Overdue"
            value={totalOverdue}
            valueColor={COLORS.danger}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<DollarOutlined />}
            iconBg="#FDECEC"
            iconColor={COLORS.danger}
            title="Total Fines"
            value={totalFine}
            prefix="$"
            precision={2}
            valueColor={COLORS.danger}
            loading={loading}
          />
        </Col>

        <Col xs={24} sm={12} lg={8} xl={6}>
          <StatCard
            icon={<DollarOutlined />}
            iconBg="#FDECEC"
            iconColor={COLORS.danger}
            title="Unpaid Fines"
            value={totalUnpaidFine}
            prefix="$"
            precision={2}
            valueColor={COLORS.danger}
            loading={loading}
          />
        </Col>
      </Row>

      {/* ===== Recent Borrowing ===== */}
      <div style={{ marginTop: 28 }}>
        <Title level={4} style={{ color: COLORS.navy }}>
          Recent Borrowing
        </Title>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(27,42,74,0.06)",
          }}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={borrowing}
            loading={loading}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: <Empty description="No recent borrowings" /> }}
          />
        </Card>
      </div>

      {/* ===== Overdue List ===== */}
      <div style={{ marginTop: 28, marginBottom: 8 }}>
        <Title level={4} style={{ color: COLORS.danger }}>
          Overdue Books
        </Title>
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(27,42,74,0.06)",
          }}
        >
          <Table
            rowKey="id"
            columns={overdueColumns}
            dataSource={overdue}
            loading={loading}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: <Empty description="No overdue books 🎉" /> }}
          />
        </Card>
      </div>
    </div>
  );
};

// ===== Reusable stat card =====
const StatCard = ({
  icon,
  iconBg,
  iconColor,
  title,
  value,
  suffix,
  prefix,
  precision,
  valueColor,
  loading,
}) => (
  <Card
    bordered={false}
    style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(27,42,74,0.06)" }}
    bodyStyle={{ padding: "18px 20px" }}
    loading={loading}
  >
    <Row align="middle" gutter={14}>
      <Col>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: iconBg,
            color: iconColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
      </Col>
      <Col flex="auto">
        <Text type="secondary" style={{ fontSize: 13 }}>
          {title}
        </Text>
        <div>
          <Statistic
            value={value}
            suffix={suffix}
            prefix={prefix}
            precision={precision}
            valueStyle={{
              fontSize: 22,
              fontWeight: 600,
              color: valueColor || "#1B2A4A",
            }}
          />
        </div>
      </Col>
    </Row>
  </Card>
);

export default HomePage;
