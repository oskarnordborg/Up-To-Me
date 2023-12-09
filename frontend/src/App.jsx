import React, { Component, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import Cards from "./components/Cards/Cards";
import Decks from "./components/Decks/Decks";
import LoginPage from "./pages/LoginPage";
import PublicPage from "./pages/PublicPage";
import MyGamesPage from "./pages/MyGamesPage";
import StartGamePage from "./pages/StartGamePage";
import GamePage from "./pages/GamePage";
import RegisterPage from "./pages/RegisterPage";
import FriendshipsPage from "./pages/FriendshipsPage";
import RequireAuth from "./components/RequireAuth";
import { ROLE_ADMIN, ROLE_USER } from "./constants/Roles";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import NavbarWrapper from "./Navbar";

class App extends Component {
  async componentDidMount() {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest.json";
    document.head.appendChild(link);
  }

  render() {
    return (
      <Router>
        <div className="App">
          <NavbarWrapper />
          <Routes>
            <Route
              element={
                <RequireAuth
                  allowedRoles={[ROLE_USER]}
                  unauthorizedComponent={<PublicPage />}
                />
              }
            >
              <Route path="/" element={<MyGamesPage />} />
            </Route>
            <Route exact path="/decks" element={<Decks />} />
            <Route
              exact
              path="/cards/:iddeck?/:deckTitle?"
              element={<Cards />}
            />
            <Route exact path="/game/:idgame" element={<GamePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login/:startemail?" element={<LoginPage />} />

            <Route path="unauthorized" element={<UnauthorizedPage />} />

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/startgame" element={<StartGamePage />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/mygames" element={<MyGamesPage />} />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route path="/user/:startemail?" element={<UserPage />} />
            </Route>
            <Route path="/friendships" element={<FriendshipsPage />} />

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
