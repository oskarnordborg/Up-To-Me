import React, { useEffect, useState } from "react";
import { useSwipeable } from "react-swipeable";
import "./Cards.css";

const apiUrl = process.env.REACT_APP_API_URL;

export default function Cards() {
  const [cards, setCards]: [any, any] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchCards = async () => {
    console.log(process.env);
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
          <h3>{cards[currentIndex]?.title}</h3>
          <p>{cards[currentIndex]?.description}</p>
        </div>
        <button className="carousel-button next" onClick={goToNextSlide}>
          Next
        </button>
      </div>
    </div>
  );
}
