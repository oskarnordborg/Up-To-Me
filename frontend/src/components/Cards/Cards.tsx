import React, { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import "./Cards.css";

import { ToastContainer, toast } from "react-toastify";

const apiUrl = process.env.REACT_APP_API_URL;

export default function Cards() {
  const [cards, setCards]: [any, any] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startY, setStartY] = useState(null);

  const fetchCards = async () => {
    try {
      const response = await fetch(apiUrl + "/card/");
      if (response.ok) {
        const resp = await response.json();
        setCards(resp.cards);
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCards();
    setRefreshing(false);
  };

  const goToNextSlide = () => {
    if (currentIndex + 1 < cards.length + 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => goToNextSlide(),
    onSwipedRight: () => goToPrevSlide(),
    onSwipedDown: (event: any) => {
      if (startY === null || event.event.touches[0].clientY - startY > 0) {
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
        body: JSON.stringify({ title: title, description: description }),
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
  const handleDeleteCardClick = async (e: any) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        apiUrl + `/card/?idcard=${cards[currentIndex].idcard}`,
        {
          method: "delete",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        toast("Card deleted, refreshing", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        setIsLoading(false);
        await fetchCards();
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  if (cards.length === 0) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="Cards-main">
      <div className="carousel-container" {...handlers}>
        <button className="carousel-button prev" onClick={goToPrevSlide}>
          Previous
        </button>
        {currentIndex !== cards.length ? (
          <div className="carousel-slide">
            <h3>{cards[currentIndex]?.title}</h3>
            <p>{cards[currentIndex]?.description}</p>
            <button
              className={`delete-button ${isLoading ? "loading" : ""}`}
              onClick={handleDeleteCardClick}
            >
              {isLoading ? (
                <>
                  <div className="small spinner"></div> Deleting Card...
                </>
              ) : (
                "Delete Card"
              )}
            </button>
          </div>
        ) : (
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
        )}
        <button className="carousel-button next" onClick={goToNextSlide}>
          Next
        </button>
      </div>
      <ToastContainer />
    </div>
  );
}
