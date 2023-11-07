import React, { Component } from "react";
import { Route, Routes } from "react-router-dom";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import Cards from "./components/Cards/Cards";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RequireAuth from "./components/RequireAuth";
import { ROLE_ADMIN, ROLE_USER } from "./constants/Roles";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    navLinks.classList.toggle("active");
  }
}

class App extends Component {
  render() {
    return (
      <div>
        <div className="App">
          <nav className="navbar">
            <div className="menu-toggle" onClick={toggleMenu}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
            <ul className="nav-links">
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="/login">Login</a>
              </li>
              <li>
                <a href="/register">Register</a>
              </li>
              <li>
                <a href="/user">User</a>
              </li>
              <li>
                <a href="/admin">Admin</a>
              </li>
            </ul>
          </nav>

          <Routes>
            <Route exact path="/" element={<Cards />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="unauthorized" element={<UnauthorizedPage />} />

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/user" element={<UserPage />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_ADMIN]} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </div>
      </div>
    );
  }
}

export default App;
