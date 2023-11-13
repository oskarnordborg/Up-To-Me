import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./Cards.css";
import { Link } from "react-router-dom";
import { getUserId } from "../RequireAuth";
import CardModal from "./CardModal";

const apiUrl = process.env.REACT_APP_API_URL;

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

  const userId = getUserId();

  const fetchCards = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      let url = apiUrl + `/card/`;
      if (userId) {
        url += `?external_id=${userId}`;
      }
      if (iddeck) {
        url += (userId ? "&" : "?") + `iddeck=${iddeck}`;
      }
      const response = await fetch(url);
      clearTimeout(timeout);
      if (response.ok) {
        const resp = await response.json();
        setCards(resp.cards);
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
    fetchCards();
  }, []);

  const handleRefresh = async () => {
    await fetchCards();
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
      const response = await fetch(apiUrl + "/card/", {
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
        await fetchCards();
        setTitle("");
        setDescription("");
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleDeleteCardClick = async (e: any, cardId: number) => {
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
  const cardItemStyle = {
    textDecoration: "none",
    color: "inherit",
  };

  const renderCard = (card: any) => (
    <Link
      key={card.idcard}
      to={`/cards/${card.idcard}/${card.title}`}
      className="card-item"
      style={cardItemStyle}
      onClick={() => openCardModal(card)}
    >
      <div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
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
    <div className="Cards-main" {...swipeHandlers}>
      <div className="deck-title">{deckTitle}</div>
      <div className="cards-grid">{cards.map((card) => renderCard(card))}</div>
      {selectedCard && (
        <CardModal
          card={selectedCard}
          close={closeCardModal}
          fetchCards={fetchCards}
        />
      )}
      <div className="carousel-slide">
        <h3>New Card</h3>
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
