import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./Decks.css";
import { Link } from "react-router-dom";
import { getUserId } from "../RequireAuth";
import FastAPIClient from "../../services/FastAPIClient";

export default function Decks({ toggleLoading }: { toggleLoading: any }) {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();
  let madeInitialCall = false;

  const fetchDecks = async () => {
    toggleLoading(true);
    try {
      const response = await fastAPIClient.get(`/decks/?external_id=${userId}`);
      if (!response.error) {
        setDecks(response.decks);
      } else {
        console.error("Failed to fetch decks data: " + response.error);
        toast("Failed to fetch decks data: " + response.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    toggleLoading(false);
  };

  useEffect(() => {
    if (madeInitialCall) {
      return;
    }
    madeInitialCall = true;
    fetchDecks();
  }, [madeInitialCall]);

  const handleRefresh = async () => {
    await fetchDecks();
  };

  const swipeHandlers = useSwipeable({
    onSwipedDown: (event: any) => {
      if (startY === null || event.event.touches[0]?.clientY - startY > 100) {
        handleRefresh();
      }
    },
    onSwiping: (event: any) => {
      if (startY === null) {
        setStartY(event.event.touches[0].clientY);
      }
    },
    onSwiped: () => {
      setStartY(null);
    },
  });

  const handleAddDeckClick = async (e: any) => {
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
    toggleLoading(true);
    try {
      const response = await fastAPIClient.post("/deck/", {
        title: title,
        description: description,
        external_id: userId,
      });
      if (!response.error) {
        toast("Deck created, refreshing", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        setTitle("");
        setDescription("");
        fetchDecks();
      } else {
        console.error("Failed to add deck");
        toast("Failed to add deck: " + response.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    toggleLoading(false);
  };

  const deckItemStyle = {
    textDecoration: "none",
    color: "inherit",
  };

  const renderDeck = (deck: any) => (
    <Link
      key={deck.iddeck}
      to={`/cards/${deck.iddeck}/${deck.title}`}
      className="deck-item"
      style={deckItemStyle}
    >
      <div className="deck-content">
        <h3>{deck.title}</h3>
        <p>{deck.description}</p>
        {deck.userdeck && <div className="user-deck-stamp">User deck</div>}
      </div>
    </Link>
  );

  return (
    <div className="Decks-main" {...swipeHandlers}>
      <div className="decks-grid">{decks.map((deck) => renderDeck(deck))}</div>
      <div className="carousel-slide">
        <h3>New Personal Deck</h3>
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
          <input
            type="text"
            id="description"
            autoComplete="off"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
            required
            aria-describedby="uidnote"
            className="input-field"
          />
        </div>
        <button
          className={`create-button ${isLoading ? "loading" : ""}`}
          onClick={handleAddDeckClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="small spinner"></div> Creating...
            </>
          ) : (
            "Create"
          )}
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}
