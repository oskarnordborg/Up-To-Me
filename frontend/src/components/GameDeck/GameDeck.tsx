import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import { jwtDecode } from "jwt-decode";
import "./GameDeck.css";

const apiUrl = process.env.REACT_APP_API_URL;

const GameDeck = ({
  onSelectDeck,
}: {
  onSelectDeck: (deckId: number) => void;
}): JSX.Element => {
  const [decks, setDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken: any = jwtDecode(jwt);
      setUserId(decodedToken.user_id);
    }
  }, []);

  const fetchDecks = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(apiUrl + `/deck/?external_id=${userId}`);
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

  const renderDeck = (deck: any) => {
    const isSelected = selectedDeck === deck.iddeck;

    const handleClick = () => {
      setSelectedDeck(deck.iddeck);
      onSelectDeck(deck.iddeck);
    };

    const deckClass = `game-deck-item ${isSelected ? "selected" : ""}`;

    return (
      <div key={deck.iddeck} className={deckClass} onClick={handleClick}>
        <h3>{deck.title}</h3>
        <p>{deck.description}</p>
      </div>
    );
  };

  if (refreshing) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="game-decks-main" {...swipeHandlers}>
      <div className="game-decks-grid">
        {decks.map((deck) => renderDeck(deck))}
      </div>
      <ToastContainer />
    </div>
  );
};
export default GameDeck;
