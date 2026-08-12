import React, { useEffect, useState } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Card, Col, Row, Statistic, Table, Tag } from "antd";

import { request } from "../../utils/request";
import styles from "../home/HomePage.module.css";

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

const HomePage = () => {
  const [books, setBooks] = useState([]);
  const [totalBook, setTotalBook] = useState(0);
  // ✅ ចំនួន Stock (Copies) ដែលអាចខ្ចីបានឥឡូវនេះ សរុបគ្រប់ Book ចូលគ្នា
  const [totalStock, setTotalStock] = useState(0);
  const [totalCopies, setTotalCopies] = useState(0);
  const [loading, setLoading] = useState(true);

  const [borrowing, setBorrowing] = useState([]);
  const [totalBorrowing, setTotalBorrowing] = useState(0);

  const [fine, setFine] = useState([]);
  const [totalFine, setTotalFine] = useState(0);

  const [overdue, setOverdue] = useState([]);
  const [totalOverdue, setTotalOverdue] = useState(0);

  useEffect(() => {
    getTotalBooks();
    getTotalBorrowing();
    getTotalFine();
    getOverdueCount();
  }, []);

  const getTotalBooks = async () => {
    try {
      // ✅ ត្រូវការ per_page ធំដើម្បីទាញ Book ទាំងអស់ ដើម្បីគណនា Stock សរុបត្រឹមត្រូវ
      // (Default Backend Return តែ 10 Records/Page ប៉ុណ្ណោះ)
      const res = await request("books?per_page=1000", "get");
      console.log(res);
      setBooks(res.list);
      setTotalBook(res.total);

      // ✅ គណនា Stock សរុប (available_copies) និង Copies សរុប (total_copies)
      const stockSum = res.list.reduce(
        (sum, b) => sum + (b.available_copies || 0),
        0,
      );
      const copiesSum = res.list.reduce(
        (sum, b) => sum + (b.total_copies || 0),
        0,
      );
      setTotalStock(stockSum);
      setTotalCopies(copiesSum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalBorrowing = async () => {
    try {
      const res = await request("borrowings", "get");
      console.log(res);
      setBorrowing(res.list);
      setTotalBorrowing(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalFine = async () => {
    try {
      const res = await request("fines", "get");
      console.log(res);
      setFine(res.list);
      setTotalFine(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getOverdueCount = async () => {
    try {
      const res = await request("borrowings?overdue=true", "get");
      setOverdue(res.list);
      setTotalOverdue(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Row gutter={[16, 16]} style={{ width: "100%" }}>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Total Books"
              value={totalBook}
              styles={{ content: { color: "#3f8600" } }}
            />
          </Card>
        </Col>

        {/* ✅ Card ថ្មី — ចំនួនសៀវភៅក្នុង Stock (អាចខ្ចីបានឥឡូវនេះ) */}
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Books in Stock"
              value={totalStock}
              suffix={`/ ${totalCopies}`}
              prefix={<InboxOutlined />}
              styles={{ content: { color: "#1677ff" } }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Active Borrowings"
              value={totalBorrowing}
              styles={{ content: { color: "#00865e" } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Overdue"
              value={totalOverdue}
              prefix={<ArrowDownOutlined />}
              styles={{ content: { color: "#cf1322" } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless">
            <Statistic
              title="Total Fines"
              value={totalFine}
              precision={2}
              prefix="$"
              styles={{ content: { color: "#cf1322" } }}
            />
          </Card>
        </Col>
        <Col span={24}>
          <h2>Recent Borrowing</h2>
          <Card>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={borrowing}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
};
export default HomePage;
