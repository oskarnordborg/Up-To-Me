import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { getUserId } from "../components/RequireAuth";
import FastAPIClient from "../services/FastAPIClient";
import "./AdminPage.css";
import ConfirmDialog from "../components/ConfirmDialog";

const AdminPage = () => {
  const [decks, setDecks] = useState([]);
  const [deletes, setDeletes] = useState({ decks: [], cards: [] });
  const [newDeckIndex, setNewDeckIndex] = useState(0);
  const [newcardIndex, setNewcardIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [updateObjects, setUpdateObjects] = useState({});
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [confirmSaveMessage, setConfirmSaveMessage] = useState(false);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();
  let madeInitialCall = false;

  const fetchDecksAndCards = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      let url = `/admin/decks/cards?external_id=${userId}`;

      const resp = await fastAPIClient.get(url);
      clearTimeout(timeout);
      if (resp.error) {
        console.error("Failed to fetch cards data: ", resp.error);
        toast("Failed to fetch cards data, " + resp.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      } else {
        setDecks(resp.decks);
        setShowSlownessMessage(false);
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setRefreshing(false);
  };

  const handleSaveConfirm = async () => {
    setRefreshing(true);
    setShowConfirmSaveModal(false);
    try {
      updateObjects.external_id = userId;
      updateObjects.deletes = deletes;
      const response = await fastAPIClient.post(
        `/admin/decks/cards`,
        updateObjects
      );

      if (!response.error) {
        fetchDecksAndCards();
        setUpdateObjects({});
      } else {
        toast("Failed to update data: " + response.error, {
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

  const handleSaveCancel = () => {
    setShowConfirmSaveModal(false);
  };

  const saveDecksAndCardsClick = async () => {
    let updates = { decks: [], cards: [] };
    decks.forEach((deck) => {
      if (deck.updated || deck.created) {
        updates.decks.push(deck);
      }
      deck.cards.forEach((card) => {
        if (card.updated || card.created) {
          updates.cards.push(card);
        }
      });
    });

    setUpdateObjects(updates);

    const confirmMessage = `Are you sure you want to save? ${updates.decks.length} decks and ${updates.cards.length} cards`;
    setConfirmSaveMessage(confirmMessage);
    setShowConfirmSaveModal(true);
  };

  useEffect(() => {
    if (madeInitialCall) {
      return;
    }
    madeInitialCall = true;
    fetchDecksAndCards();
  }, [madeInitialCall]);

  const toggleCards = (e, iddeck) => {
    if (e.target.nodeName === "INPUT" || e.target.nodeName === "BUTTON") {
      return;
    }
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
      created: true,
    };
    setDecks([...decks, newDeck]);
  };
  const removeDeck = (iddeck) => {
    const updatedDecks = decks.filter((deck) => {
      if (deck.iddeck === iddeck) {
        if (deck.iddeck > 0) {
          deletes.decks.push(deck.iddeck);
          setDeletes(deletes);
        }
        return false;
      } else {
        return true;
      }
    });
    setDecks(updatedDecks);
  };

  const addCard = (updateDeck) => {
    const newcardId = newcardIndex - 1;
    setNewcardIndex(newcardId);
    const newCard = {
      idcard: newcardId,
      iddeck: updateDeck.iddeck,
      title: "",
      description: "",
      created: true,
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
            cards: deck.cards.filter((card) => {
              if (card.idcard === idcard) {
                if (card.idcard > 0) {
                  deletes.cards.push(card.idcard);
                  setDeletes(deletes);
                }
                return false;
              } else {
                return true;
              }
            }),
          }
        : deck
    );
    setDecks(updatedDecks);
  };
  const handleDeckChange = (iddeck, property, value) => {
    const updatedDecks = decks.map((deck) =>
      deck.iddeck === iddeck
        ? { ...deck, [property]: value, updated: true }
        : deck
    );
    setDecks(updatedDecks);
  };

  const handleCardChange = (iddeck, idcard, property, value) => {
    const updatedDecks = decks.map((deck) => {
      if (deck.iddeck === iddeck) {
        const updatedCards = deck.cards.map((card) =>
          card.idcard === idcard
            ? { ...card, [property]: value, updated: true }
            : card
        );
        return { ...deck, cards: updatedCards };
      }
      return deck;
    });

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
    <>
      <div className="admin-container">
        {decks.map((deck) => (
          <div key={deck.iddeck} className="deck">
            <div
              className="deck-header"
              onClick={(e) => toggleCards(e, deck.iddeck)}
            >
              <div className="deck-input-fields">
                <input
                  className="admin-input"
                  type="text"
                  value={deck.title}
                  onChange={(e) =>
                    handleDeckChange(deck.iddeck, "title", e.target.value)
                  }
                  placeholder="Enter deck title"
                />
                <input
                  className="admin-input"
                  type="text"
                  value={deck.description}
                  onChange={(e) =>
                    handleDeckChange(deck.iddeck, "description", e.target.value)
                  }
                  placeholder="Enter deck description"
                />
              </div>
              <span className="toggle-button">
                {deck.showCards ? "/\\" : "V"}
              </span>

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
                        className="admin-input"
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

                      <textarea
                        className="admin-resize-textarea"
                        placeholder="Enter card description"
                        value={card.description}
                        onChange={(e) =>
                          handleCardChange(
                            deck.iddeck,
                            card.idcard,
                            "description",
                            e.target.value
                          )
                        }
                      ></textarea>
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
        <button className="admin-create-deck-button" onClick={addDeck}>
          Add Deck
        </button>
      </div>
      <button className="admin-save-button" onClick={saveDecksAndCardsClick}>
        Save All
      </button>
      <ConfirmDialog
        message={confirmSaveMessage}
        onConfirm={handleSaveConfirm}
        onCancel={handleSaveCancel}
        showModal={showConfirmSaveModal}
      />
      <ToastContainer />
    </>
  );
};

export default AdminPage;
