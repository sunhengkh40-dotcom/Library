import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import MainLayout from "./layouts/MainLayout";
import BookInventoryPage from "./pages/bookInventory/BookInventoryPage";
import HomePage from "./pages/home/HomePage";
import MemberPage from "./pages/member/MemberPage";
import BorrowingPage from "./pages/borrowing/BorrowingPage";
import FinePage from "./pages/fine/FinePage";
import CategoryPage from "./pages/categories/CategoryPage";
import UserPage from "./pages/users/UserPage";
import SettingsPage from "./pages/settings/SettingsPage";
import LoginPage from "./pages/login/LoginPage";
import RegisterPage from "./pages/register/RegisterPage";
import PageNotFound from "./components/404/PageNotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="member" element={<MemberPage />} />
          <Route path="bookInventory" element={<BookInventoryPage />} />
          <Route path="borrowing" element={<BorrowingPage />} />
          <Route path="fine" element={<FinePage />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="users" element={<UserPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
