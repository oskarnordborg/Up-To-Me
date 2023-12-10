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

export default function GamePage({ toggleLoading }: { toggleLoading: any }) {
  const { idgame } = useParams();
  const [cardsToPlay, setCardsToPlay] = useState([]);
  const [cardsDone, setCardsDone] = useState([]);
  const [cardsInPlay, setCardsInPlay] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startY, setStartY] = useState(null);
  const [gameInfo, setGameInfo]: [any, any] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [showConfirmResignModal, setShowConfirmResignModal] = useState(false);
  const navigate = useNavigate();

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();
  let madeInitialCall = false;

  const fetchGameInfo = async () => {
    toggleLoading(true);
    try {
      let url = `/game/${idgame}?external_id=${userId}`;

      const response = await fastAPIClient.get(url);
      if (!response.error) {
        setGameInfo(response.game);
        setCardsInPlay(response.cards_in_play);
        setCardsToPlay(response.cards_to_play);
        setCardsDone(response.cards_done);
      } else {
        console.error("Failed to fetch game data", response.error);
        toast("Failed to fetch game data" + response.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    toggleLoading(false);
  };

  useEffect(() => {
    if (madeInitialCall) {
      return;
    }
    madeInitialCall = true;
    fetchGameInfo();
  }, [madeInitialCall]);

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

  const openCardModal = (card: any, playable: boolean = true) => {
    card.playable = playable;
    setSelectedCard(card);
  };

  const closeCardModal = () => {
    setSelectedCard(null);
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

  const renderCard = (card: any, playable: boolean = true) => (
    <div
      key={card.idgame_card}
      className={`game-card-item ${card.wildcard ? "wildcard" : ""}`}
      onClick={() => openCardModal(card, playable)}
    >
      <h3>{card.title}</h3>
      <h3>{card.wildcard ? "Wildcard!" : ""}</h3>
      <div className="who-played-mark">
        {!playable && card.mycard
          ? card.performer_name
          : card.finished_time || card.skipped
          ? `You ${card.skipped && "skipped"}`
          : ""}
      </div>
      <div className="who-played-mark">
        {!playable &&
          !card.mycard &&
          card.performer &&
          (!card.finished_time && !card.skipped ? "Take Action" : "")}
      </div>
    </div>
  );

  return (
    <div className="GamePage-main" {...swipeHandlers}>
      <div>
        <div>Game</div>
        <div>Invited: {gameInfo.createdtime}</div>
        <div>
          {gameInfo.participants &&
            Object.keys(gameInfo.participants).map((username: string) => (
              <div key={username}>
                {gameInfo.participants[username].name}{" "}
                {gameInfo.participants[username].accepted
                  ? ` ${gameInfo.participants[username].skips_left}/${gameInfo.skips_count} skips left`
                  : " - invited"}
              </div>
            ))}
        </div>
      </div>
      In Play
      <div className="game-cards-grid">
        {cardsInPlay.map((card) => renderCard(card, false))}
      </div>
      To Play
      <div className="game-cards-grid">
        {cardsToPlay.map((card) => renderCard(card, true))}
      </div>
      Done
      <div className="game-cards-grid done">
        {cardsDone.map((card) => renderCard(card, false))}
      </div>
      {selectedCard && (
        <GameCardModal
          card={selectedCard}
          participants={gameInfo.participants}
          started={gameInfo.started}
          closeModal={closeCardModal}
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
            <span className="small spinner"></span> Resigning...
          </>
        ) : (
          "Resign"
        )}
      </button>
      <ToastContainer />
    </div>
  );
}
