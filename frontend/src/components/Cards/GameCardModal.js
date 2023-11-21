import React, { useState } from "react";
import "./GameCardModal.css";
import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../../services/FastAPIClient";
import { getUserId } from "../RequireAuth";

export default function GameCardModal({
  card,
  participants,
  started,
  closeModal,
  refreshPage,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const handlePlayCardClick = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    if (!started) {
      toast("Game not started, wait for all participants to accept.", {
        type: "error",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast("Please enter both title and description.", {
        type: "error",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      let body = {
        external_id: userId,
        idgame_card: card.idgame_card,
        performers: participants ? Object.keys(participants) : [],
      };
      if (card.wildcard) {
        body.title = title;
        body.description = description;
      }
      const response = await fastAPIClient.put("/game/play-card/", body);
      if (!response.error) {
        toast("Card played! moving it", {
          className: "toast-success",
          autoClose: 2000,
          hideProgressBar: true,
        });
        setIsLoading(false);
        setTitle("");
        setDescription("");
        closeModal();
        refreshPage();
      } else {
        console.error("Failed to add card: " + response.error);
        toast("Failed to add card", {
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

  const handleConfirmCardClick = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    if (!started) {
      toast("Game not started, wait for all perticipants to accept.", {
        type: "error",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fastAPIClient.put("/game/confirm-card/", {
        external_id: userId,
        idgame_card: card.idgame_card,
      });
      if (!response.error) {
        toast("Card marked as done! moving it", {
          className: "success",
          autoClose: 2000,
          hideProgressBar: true,
        });
        setIsLoading(false);
        closeModal();
        refreshPage();
      } else {
        console.error("Failed to mark card as done: " + response.error);
        toast("Failed to mark card as done", {
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

  return (
    <div className="game-modal-background" onClick={closeModal}>
      <div
        className={`game-modal-content ${card.wildcard && "wildcard"} ${
          card.finished_time && "finished"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {card.wildcard && card.played_time === "" ? (
          <>
            <div className="input-container">
              <label className="new-card-label" htmlFor="title">
                Title
              </label>
              <input
                type="text"
                id="title"
                autoComplete="off"
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                required
                aria-describedby="uidnote"
                className="input-field"
              />
            </div>
            <div className="input-container">
              <label className="new-card-label" htmlFor="description">
                Description
              </label>
              <textarea
                className="resize-textarea"
                id="description"
                placeholder="Enter card description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </>
        ) : (
          <>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            {card.played_time !== "" && <div>Played: {card.played_time}</div>}
            {card.finished_time !== "" && (
              <div>Finished: {card.finished_time}</div>
            )}
          </>
        )}
        <button className="close-button" onClick={closeModal}>
          X
        </button>
        {card.playable && (
          <div>
            <button
              onClick={handlePlayCardClick}
              className="play-card-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="small button-spinner"></div> Playing Card...
                </>
              ) : (
                <>Play Card</>
              )}
            </button>
          </div>
        )}
        {!card.playable && card.mycard && card.finished_time === "" && (
          <div>
            <button
              onClick={handleConfirmCardClick}
              className="confirm-card-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="small button-spinner"></div> Marking as
                  done...
                </>
              ) : (
                <>Mark as done</>
              )}
            </button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
