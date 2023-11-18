import React, { useState } from "react";
import "./GameCardModal.css";
import { ToastContainer, toast } from "react-toastify";

export default function GameCardModal({ card, close, refreshPage }) {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);

  const handlePlayCardClick = async (e) => {
    e.preventDefault();
    if (isLoading) {
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
      toast(`Not implemented, would play: ` + title + ", " + description, {
        autoClose: 2000,
      });
      // const response = await fetch(apiUrl + `/card/?idcard=${card.idcard}`, {
      //   method: "delete",
      //   headers: {
      //     Accept: "application/json",
      //     "Content-Type": "application/json",
      //   },
      // });
      // if (response.ok) {
      //   toast("Card deleted, refreshing", {
      //     className: "toast-success",
      //     autoClose: 1000,
      //     hideProgressBar: true,
      //   });
      //   setIsLoading(false);
      //   close();
      //   await refreshPage();
      // } else {
      //   console.error("Failed to fetch cards data");
      // }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };
  return (
    <div className="game-modal-background" onClick={close}>
      <div
        className={`game-modal-content ${card.wildcard && "wildcard"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {card.wildcard ? (
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
          </>
        )}
        <button className="close-button" onClick={close}>
          X
        </button>
        <div>
          <button onClick={handlePlayCardClick} className="play-card-button">
            Play Card
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
