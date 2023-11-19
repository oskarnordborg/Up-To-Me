import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getUserId } from "../components/RequireAuth";
import { Link } from "react-router-dom";
import "./MyGamesPage.css";
import FastAPIClient from "../services/FastAPIClient";

export default function MyGamesPage() {
  const [games, setGames] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();
  let madeInitialCall = false;

  useEffect(() => {
    if (madeInitialCall) {
      return;
    }
    madeInitialCall = true;
    fetchGames(userId);
  }, [madeInitialCall]);

  const fetchGames = async (userId) => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      const response = await fastAPIClient.get(`/games/?external_id=${userId}`);
      clearTimeout(timeout);
      if (!response.error) {
        setGames(response.games);
      } else {
        console.error("Failed to fetch games data: " + response.error);
        toast("Failed to fetch games data: " + response.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
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
      const response = await fastAPIClient.put(`/game/accept`, {
        game: idgame,
        external_id: userId,
      });
      if (!response.error) {
        handleUpdateAccepted(idgame);
      } else {
        toast("Failed to accept, try again. " + response.error, {
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
