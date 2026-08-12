import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message, Typography } from "antd";
import { MailOutlined, LockOutlined, ReadOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { request } from "../../utils/request";
import styles from "../login/Login.module.css";

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await request("login", "post", {
        email: values.email,
        password: values.password,
      });

      if (res?.token) {
        localStorage.setItem("token", res.token);
      }

      if (res?.user) {
        localStorage.setItem("user", JSON.stringify(res.user));
      }

      message.success("Login successful");
      navigate("/");
    } catch (err) {
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message || "Invalid email or password",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={styles.container}
      // style={{

      // }}
    >
      <div className={styles.conten}>
        {/* Icon badge */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#eef2ff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReadOutlined style={{ fontSize: 26, color: "#4f46e5" }} />
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Title level={3} style={{ marginBottom: 4 }}>
            LMS Admin
          </Title>
          <Text type="secondary">Welcome back! Please enter your details.</Text>
        </div>

        <Form
          layout="vertical"
          onFinish={handleLogin}
          requiredMark={false}
          initialValues={{ remember: false }}
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email format" },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
              placeholder="admin@centrallibrary.edu"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Password is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: "#9ca3af" }} />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
              {/* <Link to="/forgot-password">Forgot password?</Link> */}
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                background: "#111827",
                borderColor: "#111827",
                fontWeight: 500,
              }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        {/* <div style={{ textAlign: "center", marginBottom: 8 }}>
          <Text type="secondary">
            Don't have an account? <Link to="/register">Register here</Link>
          </Text>
        </div> */}

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} Library Management System.
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
