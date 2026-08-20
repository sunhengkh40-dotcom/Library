import React, { useState, useEffect } from "react";
import {
  Tabs,
  DatePicker,
  Radio,
  Button,
  Table,
  Statistic,
  Row,
  Col,
  Card,
  message,
  Tag,
  Empty,
  Space,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  BookOutlined,
  SwapOutlined,
  WarningOutlined,
  DollarOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { request } from "../../utils/request";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// ===== Design tokens =====
const COLORS = {
  navy: "#1B2A4A",
  navyLight: "#2E4373",
  accent: "#C08A3E", // warm brass accent, library/reading theme
  danger: "#B3413A",
  bg: "#F7F5F0",
  card: "#FFFFFF",
  border: "#E7E1D6",
  textMuted: "#6B7280",
};

const ReportPage = () => {
  const [period, setPeriod] = useState("daily");
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [stockData, setStockData] = useState(null);
  const [borrowingData, setBorrowingData] = useState(null);
  const [fineData, setFineData] = useState(null);

  const buildParams = () => {
    if (period === "custom" && dateRange) {
      return {
        from: dateRange[0].format("YYYY-MM-DD"),
        to: dateRange[1].format("YYYY-MM-DD"),
      };
    }
    return { period };
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = buildParams();
      const query = new URLSearchParams(params).toString();

      const [stock, borrowings, fines] = await Promise.all([
        request("reports/stock", "get"),
        request(`reports/borrowings?${query}`, "get"),
        request(`reports/fines?${query}`, "get"),
      ]);

      setStockData(stock);
      setBorrowingData(borrowings);
      setFineData(fines);
    } catch (err) {
      message.error("Failed to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line
  }, [period, dateRange]);

  // ===== Export Excel (exceljs — supports borders, colors, fonts) =====
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "Library Management System";
      wb.created = new Date();

      const thinBorder = {
        top: { style: "thin", color: { argb: "FFB8B2A3" } },
        left: { style: "thin", color: { argb: "FFB8B2A3" } },
        bottom: { style: "thin", color: { argb: "FFB8B2A3" } },
        right: { style: "thin", color: { argb: "FFB8B2A3" } },
      };

      const addSheet = (name, columns, rows) => {
        const ws = wb.addWorksheet(name, {
          views: [{ state: "frozen", ySplit: 1 }],
        });

        ws.columns = columns.map((c) => ({
          header: c.header,
          key: c.key,
          width: c.width || 20,
        }));

        // Header row styling
        const headerRow = ws.getRow(1);
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1B2A4A" },
          };
          cell.alignment = { vertical: "middle", horizontal: "left" };
          cell.border = thinBorder;
        });
        headerRow.height = 22;

        // Data rows
        rows.forEach((row, idx) => {
          const r = ws.addRow(row);
          r.eachCell((cell) => {
            cell.border = thinBorder;
            cell.alignment = { vertical: "middle" };
            if (idx % 2 === 1) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF7F5F0" },
              };
            }
          });
        });

        return ws;
      };

      if (stockData?.list) {
        addSheet(
          "Stock",
          [
            { header: "Title", key: "title", width: 32 },
            { header: "Category", key: "category", width: 18 },
            { header: "Total Stock", key: "total_stock", width: 14 },
            { header: "Available", key: "available", width: 14 },
            { header: "Borrowed", key: "borrowed", width: 14 },
          ],
          stockData.list,
        );
      }

      if (borrowingData?.list) {
        addSheet(
          "Borrowings",
          [
            { header: "Book", key: "book", width: 30 },
            { header: "Member", key: "member", width: 22 },
            { header: "Borrow Date", key: "borrow_date", width: 16 },
            { header: "Due Date", key: "due_date", width: 16 },
            { header: "Return Date", key: "return_date", width: 16 },
            { header: "Status", key: "status", width: 14 },
          ],
          borrowingData.list,
        );
      }

      if (stockData?.new_books?.length) {
        addSheet(
          "New Books",
          [
            { header: "Title", key: "title", width: 32 },
            { header: "Category", key: "category", width: 18 },
            { header: "Total Stock", key: "total_stock", width: 14 },
            { header: "Added At", key: "added_at", width: 20 },
          ],
          stockData.new_books,
        );
      }

      if (fineData?.list) {
        addSheet(
          "Fines",
          [
            { header: "Book", key: "book", width: 30 },
            { header: "Member", key: "member", width: 22 },
            { header: "Amount ($)", key: "amount", width: 14 },
            { header: "Status", key: "status", width: 14 },
            { header: "Date", key: "created_at", width: 16 },
          ],
          fineData.list,
        );
      }

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, `report_${dayjs().format("YYYY-MM-DD_HHmm")}.xlsx`);
      message.success("Report exported");
    } catch (err) {
      console.error(err);
      message.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  // ===== Table Columns =====
  const stockColumns = [
    { title: "Title", dataIndex: "title" },
    { title: "Category", dataIndex: "category" },
    { title: "Total Stock", dataIndex: "total_stock", align: "right" },
    { title: "Available", dataIndex: "available", align: "right" },
    {
      title: "Borrowed",
      dataIndex: "borrowed",
      align: "right",
      render: (v) => (v > 0 ? <Tag color="gold">{v}</Tag> : v),
    },
  ];

  const statusTag = (status) => {
    const map = {
      returned: { color: "green", label: "Returned" },
      borrowed: { color: "blue", label: "Borrowed" },
      overdue: { color: "red", label: "Overdue" },
      lost: { color: "default", label: "Lost" },
      paid: { color: "green", label: "Paid" },
      unpaid: { color: "red", label: "Unpaid" },
    };
    const item = map[status] || { color: "default", label: status };
    return <Tag color={item.color}>{item.label}</Tag>;
  };

  const borrowingColumns = [
    { title: "Book", dataIndex: "book" },
    { title: "Member", dataIndex: "member" },
    { title: "Borrow Date", dataIndex: "borrow_date" },
    { title: "Due Date", dataIndex: "due_date" },
    { title: "Return Date", dataIndex: "return_date", render: (v) => v || "—" },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => statusTag(v),
    },
  ];

  const newBookColumns = [
    { title: "Title", dataIndex: "title" },
    { title: "Category", dataIndex: "category" },
    { title: "Total Stock", dataIndex: "total_stock", align: "right" },
    { title: "Added At", dataIndex: "added_at" },
  ];

  const fineColumns = [
    { title: "Book", dataIndex: "book" },
    { title: "Member", dataIndex: "member" },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "right",
      render: (v) => `$${Number(v).toFixed(2)}`,
    },
    { title: "Status", dataIndex: "status", render: (v) => statusTag(v) },
    { title: "Date", dataIndex: "created_at" },
  ];

  return (
    <div style={{ padding: "28px 32px", minHeight: "100%" }}>
      {/* ===== Header ===== */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0, color: COLORS.navy }}>
            Reports
          </Title>
          <Text type="secondary">Stock, borrowing, and fine overview</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportToExcel}
            loading={exporting}
            disabled={!stockData}
            style={{
              background: COLORS.navy,
              borderColor: COLORS.navy,
              fontWeight: 500,
              height: 40,
              paddingInline: 20,
            }}
          >
            Export Excel
          </Button>
        </Col>
      </Row>

      {/* ===== Filters ===== */}
      <Card
        bordered={false}
        style={{
          marginBottom: 20,
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(27,42,74,0.06)",
        }}
        bodyStyle={{ padding: "16px 20px" }}
      >
        <Space size={16} wrap>
          <Radio.Group
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              if (e.target.value !== "custom") setDateRange(null);
            }}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="daily">Daily</Radio.Button>
            <Radio.Button value="monthly">Monthly</Radio.Button>
            <Radio.Button value="custom">Custom</Radio.Button>
          </Radio.Group>

          {period === "custom" && (
            <RangePicker
              onChange={(dates) => setDateRange(dates)}
              format="YYYY-MM-DD"
            />
          )}
        </Space>
      </Card>

      {/* ===== Summary Cards ===== */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={8} xl={4}>
          <SummaryCard
            icon={<BookOutlined />}
            iconBg="#EAF0FF"
            iconColor={COLORS.navyLight}
            title="Total Stock"
            value={stockData?.total_stock ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={5}>
          <SummaryCard
            icon={<PlusCircleOutlined />}
            iconBg="#EAF7ED"
            iconColor="#2E7D4F"
            title={
              period === "monthly" ? "New Books (Month)" : "New Books (Today)"
            }
            value={stockData?.total_new_books ?? 0}
            valueColor="#2E7D4F"
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={5}>
          <SummaryCard
            icon={<SwapOutlined />}
            iconBg="#FFF3E0"
            iconColor={COLORS.accent}
            title="Total Borrowing"
            value={borrowingData?.total_borrowings ?? 0}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={5}>
          <SummaryCard
            icon={<WarningOutlined />}
            iconBg="#FDECEC"
            iconColor={COLORS.danger}
            title="Overdue"
            value={borrowingData?.total_overdue ?? 0}
            valueColor={COLORS.danger}
          />
        </Col>
        <Col xs={24} sm={12} lg={8} xl={5}>
          <SummaryCard
            icon={<DollarOutlined />}
            iconBg="#FDECEC"
            iconColor={COLORS.danger}
            title="Total Fine"
            value={fineData?.total_amount ?? 0}
            prefix="$"
            precision={2}
            valueColor={COLORS.danger}
          />
        </Col>
      </Row>

      {/* ===== Tabs with Tables ===== */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(27,42,74,0.06)" }}
        bodyStyle={{ padding: "8px 20px 20px" }}
      >
        <Tabs
          defaultActiveKey="stock"
          items={[
            {
              key: "stock",
              label: "Stock",
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={stockColumns}
                  dataSource={stockData?.list ?? []}
                  pagination={{ pageSize: 10 }}
                  locale={{ emptyText: <Empty description="No stock data" /> }}
                />
              ),
            },
            {
              key: "new_books",
              label: `New Books (${stockData?.total_new_books ?? 0})`,
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={newBookColumns}
                  dataSource={stockData?.new_books ?? []}
                  pagination={{ pageSize: 10 }}
                  locale={{
                    emptyText: (
                      <Empty description="No new books added in this period" />
                    ),
                  }}
                />
              ),
            },
            {
              key: "borrowing",
              label: "Borrowing",
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={borrowingColumns}
                  dataSource={borrowingData?.list ?? []}
                  pagination={{ pageSize: 10 }}
                  locale={{
                    emptyText: (
                      <Empty description="No borrowings in this period" />
                    ),
                  }}
                />
              ),
            },
            {
              key: "fine",
              label: "Fine",
              children: (
                <Table
                  rowKey="id"
                  loading={loading}
                  columns={fineColumns}
                  dataSource={fineData?.list ?? []}
                  pagination={{ pageSize: 10 }}
                  locale={{
                    emptyText: <Empty description="No fines in this period" />,
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

// ===== Reusable summary stat card =====
const SummaryCard = ({
  icon,
  iconBg,
  iconColor,
  title,
  value,
  valueColor,
  prefix,
  precision,
}) => (
  <Card
    bordered={false}
    style={{ borderRadius: 12, boxShadow: "0 1px 3px rgba(27,42,74,0.06)" }}
    bodyStyle={{ padding: "18px 20px" }}
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

export default ReportPage;
