import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./Cards.css";
import { Link } from "react-router-dom";
import { getUserId } from "../RequireAuth";
import CardModal from "./CardModal";
import FastAPIClient from "../../services/FastAPIClient";

export default function Cards() {
  const { iddeck, deckTitle } = useParams();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isWildcardChecked, setIsWildcardChecked] = useState(false);

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const fetchCards = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      let url = `/cards/`;
      if (userId) {
        url += `?external_id=${userId}`;
      }
      if (iddeck) {
        url += (userId ? "&" : "?") + `iddeck=${iddeck}`;
      }
      const response = await fastAPIClient.get(url);
      clearTimeout(timeout);
      if (!response.error) {
        setCards(response.cards);
        setShowSlownessMessage(false);
      } else {
        console.error("Failed to fetch cards data", response.error);
        toast("Failed to fetch cards data" + response.error, {
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
    fetchCards();
  }, []);

  const handleRefresh = async () => {
    await fetchCards();
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

  const openCardModal = (card: any) => {
    setSelectedCard(card);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
  };

  const handleAddCardClick = async (e: any) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    if (!isWildcardChecked && (!title.trim() || !description.trim())) {
      toast("Please enter both title and description.", {
        type: "error",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      let body: any = {
        title: isWildcardChecked ? "" : title,
        description: isWildcardChecked ? "" : description,
        wildcard: isWildcardChecked,
        external_id: userId,
      };
      if (iddeck) {
        body.deck = iddeck;
      }
      const response = await fastAPIClient.post("/card/", body);
      if (!response.error) {
        toast("Card created, refreshing", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        setIsLoading(false);
        await fetchCards();
        setTitle("");
        setDescription("");
      } else {
        console.error("Failed to add card: " + response.error);
        toast("Failed to add card", {
          className: "toast-error",
          autoClose: 1000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleCheckboxChange = (event: any) => {
    setIsWildcardChecked(event.target.checked);
  };

  const cardItemStyle = {
    textDecoration: "none",
    color: "inherit",
  };

  const renderCard = (card: any) => (
    <div
      key={card.idcard_deck}
      className={`card-item ${card.wildcard && "wildcard"}`}
      style={cardItemStyle}
      onClick={() => openCardModal(card)}
    >
      <div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <p>{card.wildcard ? "Wildcard!" : ""}</p>
        {card.usercard && <div className="user-card-stamp">User card</div>}
        {showPreview && (
          <div className="card-preview">
            <div className="preview-content">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="Cards-main" {...swipeHandlers}>
      <div className="deck-title">{deckTitle}</div>
      <div className="cards-grid">{cards.map((card) => renderCard(card))}</div>
      {selectedCard && (
        <CardModal
          card={selectedCard}
          close={closeCardModal}
          refreshPage={fetchCards}
        />
      )}
      <div className="carousel-slide">
        <h3>New Card</h3>
        <label className="checkbox-container">
          <input
            type="checkbox"
            checked={isWildcardChecked}
            onChange={handleCheckboxChange}
          />
          <span className="checkmark"></span>
          Wildcard!
        </label>
        {!isWildcardChecked && (
          <>
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
          </>
        )}
        <button
          className={`create-button ${isLoading ? "loading" : ""}`}
          onClick={handleAddCardClick}
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
