import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import { setEmitFlags } from "typescript";
import { Link } from "react-router-dom";
import "./MyGamesPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

export default function MyGamesPage() {
  // const { auth } = useContext(AuthContext);
  const [userId, setUserId] = useState([]);
  const [games, setGames] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken = jwtDecode(jwt);
      setUserId(decodedToken.user_id);
      fetchGames(decodedToken.user_id);
    }
  }, []);

  const fetchGames = async (userId) => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      const response = await fetch(apiUrl + `/games/?external_id=${userId}`);
      clearTimeout(timeout);
      if (response.ok) {
        const resp = await response.json();
        setGames(resp.games);
      } else {
        console.error("Failed to fetch games data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setRefreshing(false);
  };
  const handleUpdateAccepted = (idgame) => {
    const updatedGames = games.map((game) => {
      if (game.idgame === idgame) {
        return { ...game, accepted: true };
      }
      return game;
    });

    setGames(updatedGames);
  };
  const acceptGame = async (idgame) => {
    try {
      const response = await fetch(apiUrl + `/game/accept`, {
        method: "put",
        body: JSON.stringify({
          game: idgame,
          external_id: userId,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        handleUpdateAccepted(idgame);
      } else {
        toast("Failed to accept, try again.", {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  const gameItemStyle = {
    textDecoration: "none",
    color: "inherit",
  };
  const renderGame = (game) => (
    <Link
      key={game.idgame}
      to={`/game/${game.idgame}`}
      className="game-item"
      style={gameItemStyle}
    >
      <li key={game.idgame} className="game-list-row" id={game.idgame}>
        <p className="game-title">{game.deck}</p>
        {!game.accepted && (
          <button
            onClick={() => acceptGame(game.idgame)}
            className="accept-button"
          >
            Accept
          </button>
        )}

        {game.participants.map((participant) => (
          <p key={participant} className="game-participant">
            {participant}
          </p>
        ))}
      </li>
    </Link>
  );

  if (refreshing) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <div className="slowness-message">
          {showSlownessMessage && (
            <div>
              <p>Sorry for slowness </p>
              <p>Waking up the server.. </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <section>
      <h2>Games </h2>
      <ul className="game-list">{games.map((game) => renderGame(game))}</ul>
      <ToastContainer />
    </section>
  );
}
