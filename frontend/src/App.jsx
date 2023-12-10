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

const timeoutThreshold = 3000;

class App extends Component {
  async componentDidMount() {
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/manifest.json";
    document.head.appendChild(link);
  }
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
    this.toggleLoading = this.toggleLoading.bind(this);
  }

  toggleLoading(isLoading) {
    if (!isLoading) {
      clearTimeout(this.state.slownessMessageTimeout);
      this.setState(() => ({
        loading: isLoading,
      }));
      return;
    }
    this.setState(() => ({
      loading: isLoading,
    }));
    this.setState(() => ({
      slownessMessageTimeout: setTimeout(() => {
        this.setState(() => ({
          showSlownessMessage: true,
        }));
      }, timeoutThreshold),
    }));
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
              <Route
                path="/"
                element={<MyGamesPage toggleLoading={this.toggleLoading} />}
              />
            </Route>
            <Route
              exact
              path="/decks"
              element={<Decks toggleLoading={this.toggleLoading} />}
            />
            <Route
              exact
              path="/cards/:iddeck?/:deckTitle?"
              element={<Cards toggleLoading={this.toggleLoading} />}
            />
            <Route
              exact
              path="/game/:idgame"
              element={<GamePage toggleLoading={this.toggleLoading} />}
            />
            <Route
              path="/register"
              element={<RegisterPage toggleLoading={this.toggleLoading} />}
            />
            <Route
              path="/login/:startemail?"
              element={<LoginPage toggleLoading={this.toggleLoading} />}
            />

            <Route path="unauthorized" element={<UnauthorizedPage />} />

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route
                path="/startgame"
                element={<StartGamePage toggleLoading={this.toggleLoading} />}
              />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route
                path="/mygames"
                element={<MyGamesPage toggleLoading={this.toggleLoading} />}
              />
            </Route>

            <Route element={<RequireAuth allowedRoles={[ROLE_USER]} />}>
              <Route
                path="/user/:startemail?"
                element={<UserPage toggleLoading={this.toggleLoading} />}
              />
            </Route>
            <Route
              path="/friendships"
              element={<FriendshipsPage toggleLoading={this.toggleLoading} />}
            />

            <Route element={<RequireAuth allowedRoles={[ROLE_ADMIN]} />}>
              <Route
                path="/admin"
                element={<AdminPage toggleLoading={this.toggleLoading} />}
              />
            </Route>
          </Routes>

          {this.state.loading && (
            <div className="spinner-container">
              <div className="spinner" />
              <div className="slowness-message">
                {this.state.showSlownessMessage && (
                  <div>
                    <p>Sorry for slowness </p>
                    <p>Waking up the server.. </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Router>
    );
  }
}

export default App;
