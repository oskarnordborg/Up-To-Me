import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./Decks.css";
import { Link } from "react-router-dom";
import { getUserId } from "../RequireAuth";

const apiUrl = process.env.REACT_APP_API_URL;

export default function Decks() {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const userId = getUserId();

  const fetchDecks = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      const response = await fetch(apiUrl + `/deck/?external_id=${userId}`);
      clearTimeout(timeout);
      if (response.ok) {
        const resp = await response.json();
        setDecks(resp.decks);
      } else {
        console.error("Failed to fetch decks data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleRefresh = async () => {
    await fetchDecks();
  };

  const handleMouseDown = () => {
    const newTimer = setTimeout(() => {
      setShowPreview(true);
    }, 500);
    setTimer(newTimer);
  };

  const handleMouseUp = () => {
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
    setShowPreview(false);
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
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl + "/deck/", {
        method: "post",
        body: JSON.stringify({
          title: title,
          description: description,
          external_id: userId,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        toast("Card created, refreshing", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        setIsLoading(false);
        await fetchDecks();
        setTitle("");
        setDescription("");
      } else {
        console.error("Failed to fetch decks data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteDeckClick = async (e: any, deckId: number) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }

    toast("Not implemented.", {
      type: "error",
      autoClose: 2000,
      hideProgressBar: true,
    });

    setIsLoading(false);
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
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div>
        <h3>{deck.title}</h3>
        <p>{deck.description}</p>
        {deck.userdeck && <div className="user-deck-stamp">User deck</div>}
        {showPreview && (
          <div className="deck-preview">
            <div className="preview-content">
              <h3>{deck.title}</h3>
              <p>{deck.description}</p>
            </div>
          </div>
        )}
        {/* <button
        className={`deck-delete-button ${isLoading ? "loading" : ""}`}
        onClick={(e) => handleDeleteDeckClick(e, deck.iddeck)}
      >
        {isLoading ? (
          <>
            <div className="small spinner"></div> Deleting Deck...
          </>
        ) : (
          "Delete Deck"
        )}
      </button> */}
      </div>
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
    <div className="Decks-main" {...swipeHandlers}>
      <div className="decks-grid">{decks.map((deck) => renderDeck(deck))}</div>
      <div className="carousel-slide">
        <h3>New Deck</h3>
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
