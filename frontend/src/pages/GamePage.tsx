import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./GamePage.css";
import { Link } from "react-router-dom";
import { getUserId } from "../components/RequireAuth";
import GameCardModal from "../components/Cards/GameCardModal";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";

const apiUrl = process.env.REACT_APP_API_URL;

export default function GamePage() {
  const { idgame } = useParams();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);
  const [gameInfo, setGameInfo]: [any, any] = useState("");
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showConfirmResignModal, setShowConfirmResignModal] = useState(false);
  const navigate = useNavigate();

  const userId = getUserId();

  const fetchGameInfo = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      let url = apiUrl + `/game/${idgame}?external_id=${userId}`;

      const response = await fetch(url);
      clearTimeout(timeout);
      if (response.ok) {
        const resp = await response.json();
        setGameInfo(resp.game);
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
    fetchGameInfo();
  }, []);

  const handleRefresh = async () => {
    await fetchGameInfo();
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

  const handlePlayCardClick = async (e: any, cardId: number) => {
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

  const resignGame = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(apiUrl + `/game/?idgame=${idgame}`, {
        method: "delete",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        toast("Game resigned", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        navigate(`/mygames`);
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  const handleResignConfirm = () => {
    setShowConfirmResignModal(false);
    resignGame();
  };

  const handleResignCancel = () => {
    setShowConfirmResignModal(false);
  };

  const handleResignClick = (e: any) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setShowConfirmResignModal(true);
  };

  const renderCard = (card: any) => (
    <div
      key={card.idgame_card}
      className="card-item"
      onClick={() => openCardModal(card)}
    >
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
    <div className="GamePage-main" {...swipeHandlers}>
      <div>
        <div>Game</div>
        <div>Started: {gameInfo.createdtime}</div>
        <div>
          {gameInfo.participants?.map((part: string) => (
            <div key={part}>{part}</div>
          ))}
        </div>
      </div>
      <div className="cards-grid">{cards.map((card) => renderCard(card))}</div>
      {selectedCard && (
        <GameCardModal
          card={selectedCard}
          close={closeCardModal}
          refreshPage={fetchGameInfo}
        />
      )}
      <ConfirmDialog
        message="Are you sure you want to resign?"
        onConfirm={handleResignConfirm}
        onCancel={handleResignCancel}
        showModal={showConfirmResignModal}
      />
      <button
        className={`resign-button ${isLoading ? "loading" : ""}`}
        onClick={handleResignClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <div className="small spinner"></div> Resigning...
          </>
        ) : (
          "Resign"
        )}
      </button>
      <ToastContainer />
    </div>
  );
}
