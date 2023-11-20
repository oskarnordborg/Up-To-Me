import React, { useState } from "react";
import "./GameSettingsModal.css";
import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../services/FastAPIClient";
import { getUserId } from "./RequireAuth";

export default function CardModal({
  cardCount,
  participantCount,
  closeFunction,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [wildcards, setWildcards] = useState(0);
  const [skips, setSkips] = useState(0);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  // const handleDeleteCardClick = async (e) => {
  //   e.preventDefault();
  //   if (isLoading) {
  //     return;
  //   }
  //   setIsLoading(true);
  //   try {
  //     const response = await fastAPIClient.delete(
  //       `/card_deck/?idcard_deck=${card.idcard_deck}&external_id=${userId}`
  //     );
  //     if (!response.error) {
  //       toast("Card deleted, refreshing", {
  //         className: "toast-success",
  //         autoClose: 1000,
  //         hideProgressBar: true,
  //       });
  //       closeFunction();
  //       await refreshPage();
  //     } else {
  //       console.error("Failed to delete card: " + response.error);
  //       toast("Failed to delete card: " + response.error, {
  //         className: "error",
  //         autoClose: 1000,
  //         hideProgressBar: true,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("An error occurred while fetching data:", error);
  //   }
  //   setIsLoading(false);
  // };
  return (
    <div className="modal-background" onClick={closeFunction}>
      <div className={`modal-content`} onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={closeFunction}>
          X
        </button>
        <h2>Game Settings</h2>
        <p>
          Game will be started for {participantCount} people, each player will
          get {Math.floor(cardCount / participantCount)} randomly selected cards
          from the deck.
        </p>
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
      <ToastContainer />
    </div>
  );
}
