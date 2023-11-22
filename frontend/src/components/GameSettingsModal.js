import React, { useState } from "react";
import "./GameSettingsModal.css";
import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../services/FastAPIClient";
import { getUserId } from "./RequireAuth";
import RadioButton from "./RadioButton";
import { useNavigate } from "react-router-dom";

export default function GameSettingsModal({
  deck,
  participants,
  closeFunction,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [wildcards, setWildcards] = useState(0);
  const [skips, setSkips] = useState(0);
  const [selectedGameMode, setSelectedGameMode] = useState("all");
  const navigate = useNavigate();

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const handleStartGameClick = async (e) => {
    e.preventDefault();

    try {
      const response = await fastAPIClient.post("/game/", {
        external_id: userId,
        deck: deck.iddeck,
        participants: participants.map((item) => item.idappuser),
        wildcards: wildcards,
        skips: skips,
        gamemode: selectedGameMode,
      });
      if (!response.error) {
        toast("Game created!", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        setTimeout(() => {
          navigate(`/mygames`);
        }, 2500);
        setIsLoading(false);
      } else {
        console.error("Failed to start game: " + response.error);
        toast("Game created!", {
          className: "toast-error",
          autoClose: 1000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };
  const handleOptionChange = (e) => {
    setSelectedGameMode(e.target.value);
  };

  const gameModes = [
    { label: "All cards", value: "all" },
    { label: "Deal cards", value: "deal" },
  ];

  return (
    <div className="modal-background" onClick={closeFunction}>
      <div className={`modal-content`} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={closeFunction}>
          X
        </button>
        <h2>Game Settings</h2>
        <RadioButton
          options={gameModes}
          selectedOption={selectedGameMode}
          onChange={handleOptionChange}
        />
        {selectedGameMode === "deal" ? (
          <p>
            Game will be started for {participants.length + 1} people, each
            player will get{" "}
            {Math.floor(deck.cardcount / (participants.length + 1))} randomly
            selected cards from the deck.
          </p>
        ) : (
          <p>
            Game will be started for {participants.length + 1} people, each
            player will get their set of all the {deck.cardcount} cards in the
            deck.
          </p>
        )}
        <br />
        <p>
          And
          <input
            type="text"
            id="wildcards"
            autoComplete="off"
            onChange={(e) => setWildcards(e.target.value)}
            value={wildcards}
            required
            aria-describedby="uidnote"
            className="game-settings-input-field"
          />
          Wildcards, on which the player can decide what it says.
        </p>
        <br />
        <p>
          And
          <input
            type="text"
            id="skips"
            autoComplete="off"
            onChange={(e) => setSkips(e.target.value)}
            value={skips}
            required
            aria-describedby="uidnote"
            className="game-settings-input-field"
          />
          Skips, so you can say no to cards and not do them.
        </p>
      </div>
      <button className="start-game-button" onClick={handleStartGameClick}>
        Start Game
      </button>
      <ToastContainer />
    </div>
  );
}
