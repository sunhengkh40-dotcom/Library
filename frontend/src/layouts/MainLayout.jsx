import React, { useState } from "react";
import {
  AppstoreOutlined,
  BookOutlined,
  TeamOutlined,
  SwapOutlined,
  DollarOutlined,
  TagsOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Avatar, Badge, Dropdown, Button } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styles from "../layouts/MainLayout.module.css";
// ⚠️ ត្រូវប្តូរ path នេះតាម folder depth ជាក់ស្តែង
import { request } from "../utils/request";

const { Header, Content, Sider } = Layout;

const SIDER_WIDTH = 220;
const SIDER_COLLAPSED_WIDTH = 80;

// ចំណាំ field "adminOnly" លើ item ដែលចង់លាក់ចំពោះមិនមែន admin
const allMenuItems = [
  { key: "/", icon: <AppstoreOutlined />, label: "Dashboard" },
  { key: "/bookInventory", icon: <BookOutlined />, label: "Books" },
  { key: "/member", icon: <TeamOutlined />, label: "Members" },
  { key: "/borrowing", icon: <SwapOutlined />, label: "Borrowings" },
  { key: "/fine", icon: <DollarOutlined />, label: "Fines" },
  { key: "/categories", icon: <TagsOutlined />, label: "Categories" },
  { key: "/users", icon: <UserOutlined />, label: "Users", adminOnly: true },
  // { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
];

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const currentSiderWidth = collapsed ? SIDER_COLLAPSED_WIDTH : SIDER_WIDTH;

  // ---------- User ដែល Login ស្រាប់ (កំណត់ដោយ LoginPage.jsx ក្នុង localStorage) ----------
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = currentUser?.role === "admin";

  // ---------- Filter Menu តាម Role — លាក់ Item ណាមួយដែល adminOnly=true បើមិនមែន Admin ----------
  const menuItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    localStorage.removeItem("user");
    navigate("/login");
    try {
      await request("logout", "post");
    } catch (err) {
      console.error(err);
    }
  };

  const userMenuItems = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Layout className={styles.root}>
      <Sider
        className={styles.sider}
        width={SIDER_WIDTH}
        collapsedWidth={SIDER_COLLAPSED_WIDTH}
        collapsed={collapsed}
        style={{ width: currentSiderWidth }}
      >
        <div className={styles.brand}>
          {!collapsed && (
            <>
              <h2>LMS Admin</h2>
              <p>Central Library</p>
            </>
          )}
        </div>

        <Menu
          className={styles.menu}
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[location.pathname === "/" ? "/" : location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header className={styles.header} style={{ left: currentSiderWidth }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              color: "#fff",
              fontSize: 18,
              marginRight: "auto",
            }}
          />

          <div className={styles.headerRight}>
            {/* <span className={styles.headerLink}>Branches</span>
            <span className={styles.headerLink}>Reports</span> */}
            {/* <Badge dot>
              <BellOutlined className={styles.headerIcon} />
            </Badge> */}
            {/* <QuestionCircleOutlined className={styles.headerIcon} /> */}

            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Avatar
                size={32}
                icon={<UserOutlined />}
                style={{ cursor: "pointer" }}
              />
            </Dropdown>
          </div>
        </Header>

        <Content
          className={styles.content}
          style={{
            marginLeft: currentSiderWidth,
            width: `calc(100% - ${currentSiderWidth}px)`,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
