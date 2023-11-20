import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUserId } from "./components/RequireAuth";

function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    navLinks.classList.toggle("active");
  }
}

const userId = getUserId();

const Navbar = () => {
  const navigate = useNavigate();
  const navbarRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        const navLinks = document.querySelector(".nav-links");
        if (navLinks && navLinks.classList.contains("active")) {
          navLinks.classList.remove("active");
        }
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const goBack = () => {
    navigate(-1);
  };

  const goForward = () => {
    navigate(1);
  };

  return (
    <nav className="navbar" ref={navbarRef}>
      <button className="navigation-button" onClick={goBack}>
        {"<"}
      </button>
      <button className="navigation-button" onClick={goForward}>
        {">"}
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
          New Game
        </a>
      )}
      <div className="menu-toggle" onClick={toggleMenu}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </nav>
  );
};

export default Navbar;
