import React, { Component } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import Cards from "./components/Cards/Cards";
import Decks from "./components/Decks/Decks";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import MyGamesPage from "./pages/MyGamesPage";
import StartGamePage from "./pages/StartGamePage";
import RegisterPage from "./pages/RegisterPage";
import RequireAuth from "./components/RequireAuth";
import { getUserId } from "./components/RequireAuth";
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

const userId = getUserId();
class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <nav className="navbar">
            <div className="menu-toggle" onClick={toggleMenu}>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
            <ul className="nav-links">
              {userId ? (
                <>
                  <li>
                    <a href="/games">My Games</a>
                  </li>
                  <li>
                    <a href="/decks">Decks</a>
                  </li>
                  <li>
                    <a href="/cards">Cards</a>
                  </li>
                  <li>
                    <a href="/user">User Page</a>
                  </li>
                  <li>
                    <a href="/admin">Admin</a>
                  </li>
                </>
              ) : (
                <li>
                  <a href="/login">Login</a>
                </li>
              )}
            </ul>
            {userId && (
              <a className="start-game-link" href="/startgame">
                Start game
              </a>
            )}
          </nav>
          <Routes>
            <Route exact path="/" element={<Decks />} />
            <Route exact path="/decks" element={<Decks />} />
            <Route
              exact
              path="/cards/:iddeck?/:deckTitle?"
              element={<Cards />}
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login/:startemail?" element={<LoginPage />} />

            <Route path="unauthorized" element={<UnauthorizedPage />} />

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/startgame" element={<StartGamePage />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/games" element={<MyGamesPage />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/user/:startemail?" element={<UserPage />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_ADMIN]} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </div>
      </Router>
    );
  }
}

export default App;
