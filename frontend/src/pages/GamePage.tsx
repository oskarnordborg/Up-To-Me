import React, { useEffect, useState } from "react";

import { useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { useSwipeable } from "react-swipeable";
import "./GamePage.css";
import { getUserId } from "../components/RequireAuth";
import GameCardModal from "../components/Cards/GameCardModal";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import FastAPIClient from "../services/FastAPIClient";

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

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const fetchGameInfo = async () => {
    setRefreshing(true);
    const timeoutThreshold = 3000;
    const timeout = setTimeout(() => {
      setShowSlownessMessage(true);
    }, timeoutThreshold);
    try {
      let url = `/game/${idgame}?external_id=${userId}`;

      const response = await fastAPIClient.get(url);
      clearTimeout(timeout);
      if (!response.error) {
        setGameInfo(response.game);
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
      const response = await fastAPIClient.delete(
        `/game/?idgame=${idgame}&external_id=${userId}`
      );
      if (!response.error) {
        toast("Game resigned", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        navigate(`/mygames`);
      } else {
        console.error("Failed to resign game: " + response.error);
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
      className={`card-item ${card.wildcard && "wildcard"}`}
      onClick={() => openCardModal(card)}
    >
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <h3>{card.wildcard ? "Wildcard!" : ""}</h3>
      {card.usercard && <div className="user-card-stamp">User card</div>}
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
