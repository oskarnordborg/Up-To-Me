import React, { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import "./Cards.css";

export default function Cards() {
  const [cards, setCards]: [any, any] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchCards = async () => {
    try {
      const response = await fetch("https://up-to-me-api.onrender.com/");
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

  const goToNextSlide = () => {
    setCurrentIndex((currentIndex + 1) % cards.length);
  };

  const goToPrevSlide = () => {
    setCurrentIndex((currentIndex - 1 + cards.length) % cards.length);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => goToNextSlide(),
    onSwipedRight: () => goToPrevSlide(),
  });

  // Add conditional rendering to handle the case when cards is empty or undefined
  if (cards.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="Cards-main">
      <div className="carousel-container" {...handlers}>
        <button className="carousel-button prev" onClick={goToPrevSlide}>
          Previous
        </button>
        <div className="carousel-slide">
          <h3>{cards[currentIndex]?.name}</h3>
          <p>{cards[currentIndex]?.description}</p>
        </div>
        <button className="carousel-button next" onClick={goToNextSlide}>
          Next
        </button>
      </div>
    </div>
  );
}
