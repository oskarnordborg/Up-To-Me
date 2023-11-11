import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { setEmitFlags } from "typescript";
import "./MyGamesPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

export default function MyGamesPage() {
  // const { auth } = useContext(AuthContext);
  const [games, setGames] = useState([]);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken = jwtDecode(jwt);
      fetchGames(decodedToken.user_id);
    }
  }, []);

  const fetchGames = async (user_id) => {
    try {
      const response = await fetch(apiUrl + `/games/?external_id=${user_id}`);
      if (response.ok) {
        const resp = await response.json();
        console.log(resp);
        setGames(resp.games);
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  return (
    <section>
      <h2>Games </h2>
      <ul className="game-list">
        {games.map((game) => (
          <li key={game.id} className="game-list-row">
            <p className="game-title">{game.deck}</p>
            {game.participants.map((participant) => (
              <p className="game-participant">{participant}</p>
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
