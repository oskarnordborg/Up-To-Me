import "./Main.css";
import Cards from "../Cards/Cards";

function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  if (navLinks) {
    navLinks.classList.toggle("active");
  }
}

function Main() {
  return (
    <div className="App">
      <nav className="navbar">
        <div className="menu-toggle" onClick={toggleMenu}>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
        <ul className="nav-links">
          <li>
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Services</a>
          </li>
          <li>
            <a href="#">Contact</a>
          </li>
        </ul>
      </nav>
      <Cards />
    </div>
  );
}

export default Main;
