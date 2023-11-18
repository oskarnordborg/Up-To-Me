import React, { useState } from "react";
import "./CardModal.css";
import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../../services/FastAPIClient";
import { getUserId } from "../RequireAuth";

export default function CardModal({ card, close, refreshPage }) {
  const [isLoading, setIsLoading] = useState(false);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const handleDeleteCardClick = async (e) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fastAPIClient.delete(
        `/card_deck/?idcard_deck=${card.idcard_deck}&external_id=${userId}`
      );
      if (!response.error) {
        toast("Card deleted, refreshing", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        close();
        await refreshPage();
      } else {
        console.error("Failed to delete card: " + response.error);
        toast("Failed to delete card: " + response.error, {
          className: "error",
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
    <div className="modal-background" onClick={close}>
      <div
        className={`modal-content ${card.wildcard && "wildcard"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{card.title}</h2>
        <p>{card.description}</p>
        <p>{card.wildcard ? "Wildcard!" : ""}</p>
        <button className="close-button" onClick={close}>
          X
        </button>
        {card.usercard && <div className="user-card-stamp">User card</div>}
        {card.usercard && (
          <button
            className={`delete-button ${isLoading ? "loading" : ""}`}
            onClick={handleDeleteCardClick}
          >
            {isLoading ? (
              <>
                <div className="small spinner"></div> Deleting Card...
              </>
            ) : (
              "Delete Card"
            )}
          </button>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
