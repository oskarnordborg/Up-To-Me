import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import { jwtDecode } from "jwt-decode";
import "./ChooseGameDeck.css";
import FastAPIClient from "../../services/FastAPIClient";

const ChooseGameDeck = ({
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

  const fastAPIClient = new FastAPIClient();

  const fetchDecks = async (inUserId: string = "") => {
    setRefreshing(true);
    try {
      const response = await fastAPIClient.get(
        `/deck/?external_id=${inUserId ? inUserId : userId}`
      );
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
    setRefreshing(false);
  };

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken: any = jwtDecode(jwt);
      setUserId(decodedToken.user_id);
      fetchDecks(decodedToken.user_id);
      return;
    }
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
export default ChooseGameDeck;
