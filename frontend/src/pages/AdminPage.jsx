import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getUserId } from "../components/RequireAuth";
import "./AdminPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

const AdminPage = () => {
  const [decks, setDecks] = useState([]);
  const [newDeckIndex, setNewDeckIndex] = useState(0);
  const [newcardIndex, setNewcardIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);

  const userId = getUserId();

  const fetchDecksAndCards = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      let url = apiUrl + `/decks/cards?external_id=${userId}`;

      const response = await fetch(url);
      clearTimeout(timeout);
      if (response.ok) {
        const resp = await response.json();
        setDecks(resp.decks);
        setShowSlownessMessage(false);
      } else {
        const message = await response.text();
        console.error("Failed to fetch cards data", message);
        toast("Failed to fetch cards data" + message, {
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
    fetchDecksAndCards();
  }, []);

  const toggleCards = (e, iddeck) => {
    if (e.target.nodeName === "INPUT" || e.target.nodeName === "BUTTON") {
      return;
    }
    console.log(iddeck);
    console.log(decks);
    const updatedDecks = decks.map((deck) =>
      deck.iddeck === iddeck ? { ...deck, showCards: !deck.showCards } : deck
    );
    setDecks(updatedDecks);
  };

  const addDeck = () => {
    const newDeckId = newDeckIndex - 1;
    setNewDeckIndex(newDeckId);
    const newDeck = {
      iddeck: newDeckId,
      title: "",
      description: "",
      cards: [],
      showCards: true,
    };
    setDecks([...decks, newDeck]);
  };
  const removeDeck = (iddeck) => {
    const updatedDecks = decks.filter((deck) => deck.iddeck !== iddeck);
    setDecks(updatedDecks);
  };

  const addCard = (updateDeck) => {
    const newcardId = newcardIndex - 1;
    setNewcardIndex(newcardId);
    const newCard = {
      idcard: newcardId,
      title: "",
      description: "",
    };
    const updatedDecks = decks.map((deck) =>
      deck.iddeck === updateDeck.iddeck
        ? { ...deck, cards: [...deck.cards, newCard] }
        : deck
    );
    setDecks(updatedDecks);
  };
  const removeCard = (iddeck, idcard) => {
    const updatedDecks = decks.map((deck) =>
      deck.iddeck === iddeck
        ? {
            ...deck,
            cards: deck.cards.filter((card) => card.idcard !== idcard),
          }
        : deck
    );
    setDecks(updatedDecks);
  };
  const handleDeckChange = (iddeck, property, value) => {
    const updatedDecks = decks.map((deck) =>
      deck.iddeck === iddeck ? { ...deck, [property]: value } : deck
    );
    setDecks(updatedDecks);
  };

  const handleCardChange = (iddeck, idcard, property, value) => {
    const updatedDecks = decks.map((deck) => {
      if (deck.iddeck === iddeck) {
        const updatedCards = deck.cards.map((card) =>
          card.idcard === idcard ? { ...card, [property]: value } : card
        );
        return { ...deck, cards: updatedCards };
      }
      return deck;
    });
    console.log(updatedDecks);
    setDecks(updatedDecks);
  };

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
    <div className="admin-container">
      {decks.map((deck) => (
        <div key={deck.iddeck} className="deck">
          <div
            className="deck-header"
            onClick={(e) => toggleCards(e, deck.iddeck)}
          >
            <input
              type="text"
              value={deck.title}
              onChange={(e) =>
                handleDeckChange(deck.iddeck, "title", e.target.value)
              }
              placeholder="Enter deck title"
            />
            <input
              type="text"
              value={deck.description}
              onChange={(e) =>
                handleDeckChange(deck.iddeck, "description", e.target.value)
              }
              placeholder="Enter deck description"
            />
            <span className="toggle-button">{deck.showCards ? "▲" : "▼"}</span>

            <button
              className="admin-delete-button"
              onClick={() => removeDeck(deck.iddeck)}
            >
              X
            </button>
          </div>
          {deck.showCards && (
            <div className="card-list">
              {deck.cards.map((card) => (
                <div key={card.idcard} className="card">
                  <div className="card-input-fields">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) =>
                        handleCardChange(
                          deck.iddeck,
                          card.idcard,
                          "title",
                          e.target.value
                        )
                      }
                      placeholder="Enter card title"
                    />

                    <input
                      type="text"
                      value={card.description}
                      onChange={(e) =>
                        handleCardChange(
                          deck.iddeck,
                          card.idcard,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Enter card description"
                    />
                  </div>
                  <button
                    className="admin-delete-button"
                    onClick={() => removeCard(deck.iddeck, card.idcard)}
                  >
                    X
                  </button>
                </div>
              ))}
              <button
                className="admin-create-button"
                onClick={() => addCard(deck)}
              >
                Add Card
              </button>
            </div>
          )}
        </div>
      ))}
      <button className="admin-create-button" onClick={addDeck}>
        Add Deck
      </button>
    </div>
  );
};

export default AdminPage;
