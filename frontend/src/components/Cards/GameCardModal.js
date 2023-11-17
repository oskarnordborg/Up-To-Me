import React, { useState } from "react";
import "./GameCardModal.css";
import { ToastContainer, toast } from "react-toastify";

export default function GameCardModal({ card, close, refreshPage }) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePlayCardClick = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      toast(`Not implemented`, {
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
    <div className="modal-background" onClick={close}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{card.title}</h2>
        <p>{card.description}</p>
        <button className="close-button" onClick={close}>
          X
        </button>
        <div className="play-card-container">
          <button onClick={handlePlayCardClick} className="play-card-button">
            Play Card
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
