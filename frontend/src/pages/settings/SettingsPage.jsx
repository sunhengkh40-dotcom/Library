import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Divider,
  Tag,
} from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { request } from "../../utils/request";

const SettingsPage = () => {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    getMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMe = async () => {
    try {
      const res = await request("user", "get");
      setMe(res);
      profileForm.setFieldsValue({ name: res.name, email: res.email });
    } catch (err) {
      console.error(err);
    }
  };

  // ---------- Update profile (name/email) ----------
  const handleUpdateProfile = async () => {
    try {
      const values = await profileForm.validateFields();
      setProfileLoading(true);

      // ប្រើ endpoint ដដែលនឹង UserController@update (admin ធម្មតា)
      // តែផ្ញើ id របស់ខ្លួនឯង — ត្រូវប្រាកដថា role field មិនត្រូវការសម្រាប់ self-update
      await request(`users/${me.id}`, "put", {
        name: values.name,
        email: values.email,
        role: me.role, // រក្សា role ដដែល មិនអនុញ្ញាតឲ្យ user ប្តូរ role ខ្លួនឯង
      });

      message.success("Profile updated successfully");
      await getMe();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // ---------- Change password ----------
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      setPasswordLoading(true);

      await request(`users/${me.id}`, "put", {
        name: me.name,
        email: me.email,
        role: me.role,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });

      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch (err) {
      if (err?.errorFields) return;
      console.error(err?.response?.data);
      message.error(
        err?.response?.data?.message || "Failed to change password",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 0 }}>Settings</h2>
      <p style={{ color: "#888", marginTop: 4, marginBottom: 24 }}>
        Manage your profile information and account security.
      </p>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Profile Information">
            {me && (
              <div style={{ marginBottom: 16 }}>
                <Tag
                  color={
                    me.role === "admin"
                      ? "red"
                      : me.role === "librarian"
                        ? "blue"
                        : "default"
                  }
                >
                  {me.role}
                </Tag>
              </div>
            )}
            <Form form={profileForm} layout="vertical" requiredMark="optional">
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Your name" />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Invalid email format" },
                ]}
              >
                <Input placeholder="you@library.com" />
              </Form.Item>
              <Button
                type="primary"
                loading={profileLoading}
                onClick={handleUpdateProfile}
              >
                Save Changes
              </Button>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Change Password">
            <Form form={passwordForm} layout="vertical" requiredMark="optional">
              <Form.Item
                name="password"
                label="New Password"
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="••••••••"
                />
              </Form.Item>
              <Form.Item
                name="password_confirmation"
                label="Confirm New Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("Passwords do not match"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="••••••••"
                />
              </Form.Item>
              <Button
                type="primary"
                danger
                loading={passwordLoading}
                onClick={handleChangePassword}
              >
                Change Password
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Divider />
      <p style={{ color: "#888", fontSize: 12 }}>
        Need to change another user's role or permissions? Go to the{" "}
        <strong>Users</strong> page (Admin access required).
      </p>
    </div>
  );
};

export default SettingsPage;
