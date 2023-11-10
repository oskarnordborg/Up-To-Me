import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./Decks.css";
import { Link } from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL;

export default function Decks() {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);

  const fetchDecks = async () => {
    try {
      const response = await fetch(apiUrl + "/deck/");
      if (response.ok) {
        const resp = await response.json();
        setDecks(resp.decks);
      } else {
        console.error("Failed to fetch decks data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
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

    toast("Not implemented.", {
      type: "error",
      autoClose: 2000,
      hideProgressBar: true,
    });

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
      to={`/cards/${deck.iddeck}`}
      className="deck-item"
      style={deckItemStyle}
    >
      <div>
        <h3>{deck.title}</h3>
        <p>{deck.description}</p>
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

  return (
    <div className="Decks-main" {...swipeHandlers}>
      <div className="decks-grid">{decks.map((deck) => renderDeck(deck))}</div>
      <div className="create-deck-container">
        <button
          className={`deck-create-button ${isLoading ? "loading" : ""}`}
          onClick={handleAddDeckClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="small spinner"></div> Creating...
            </>
          ) : (
            "Create New Deck"
          )}
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}
