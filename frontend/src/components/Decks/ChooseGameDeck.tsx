import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import { getUserId } from "../RequireAuth";
import "./ChooseGameDeck.css";
import FastAPIClient from "../../services/FastAPIClient";

const ChooseGameDeck = ({
  onSelectDeck,
}: {
  onSelectDeck: (deckId: number) => void;
}): JSX.Element => {
  const [decks, setDecks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [selectedDeck, setSelectedDeck] = useState(null);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();
  let madeInitialCall = false;

  const fetchDecks = async (inUserId: string = "") => {
    setRefreshing(true);
    try {
      const response = await fastAPIClient.get(
        `/decks/?external_id=${inUserId ? inUserId : userId}`
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
    if (madeInitialCall) {
      return;
    }
    madeInitialCall = true;
    fetchDecks(userId);
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
