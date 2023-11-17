import React from "react";
import { useNavigate } from "react-router-dom";

import { getUserId } from "./components/RequireAuth";

function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    navLinks.classList.toggle("active");
  }
}

const userId = getUserId();

class Navbar extends React.Component {
  constructor(props) {
    super(props);
    this.navigate = props.navigate;
  }

  goBack = () => {
    this.navigate(-1);
  };

  goForward = () => {
    this.navigate(1);
  };

  render() {
    return (
      <nav className="navbar">
        <div className="menu-toggle" onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
        <button className="navigation-button" onClick={this.goBack}>
          {"🡸"}
        </button>
        <button className="navigation-button" onClick={this.goForward}>
          {"🡺"}
        </button>
        <ul className="nav-links">
          {userId ? (
            <>
              <li>
                <a href="/mygames">My Games</a>
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
            <>
              <li>
                <a href="/login">Login</a>
              </li>
              <li>
                <a href="/register">Register</a>
              </li>
            </>
          )}
        </ul>
        {userId && (
          <a className="start-game-link" href="/startgame">
            Start game
          </a>
        )}
      </nav>
    );
  }
}

const NavbarWrapper = (props) => {
  const navigate = useNavigate();
  return <Navbar {...props} navigate={navigate} />;
};

export default NavbarWrapper;
