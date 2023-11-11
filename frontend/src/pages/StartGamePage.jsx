import { useContext, useEffect, useRef, useState } from "react";
import authContext from "../context/AuthProvider";
import FastAPIClient from "../services/FastAPIClient";
import { jwtDecode } from "jwt-decode";
import GameDeck from "../components/GameDeck/GameDeck";
import "./StartGamePage.css";
import { useNavigate } from "react-router-dom";

import { ToastContainer, toast } from "react-toastify";
const apiUrl = process.env.REACT_APP_API_URL;

export default function StartGamePage() {
  const userRef = useRef();
  const suggestionsRef = useRef(null);
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [member, setMember] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const navigate = useNavigate();

  const handleDeckSelect = (deckId) => {
    setSelectedDeck(deckId);
  };

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken = jwtDecode(jwt);
      setUserId(decodedToken.user_id);
    }
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleClickOutside = (e) => {
    if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
      setSuggestions([]);
      const suggestionsList = document.getElementById("suggestions");
      suggestionsList.style.display = "none";
    }
  };

  const handleStartGame = async (e) => {
    e.preventDefault();

    if (!selectedDeck || !selectedParticipants) {
      toast("Please choose a deck and at least one member", {
        type: "warning",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl + "/game/", {
        method: "post",
        body: JSON.stringify({
          external_id: userId,
          deck: selectedDeck,
          participants: selectedParticipants.map((item) => item.idappuser),
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        toast("Game created!", {
          className: "toast-success",
          autoClose: 1000,
          hideProgressBar: true,
        });
        setTimeout(() => {
          navigate(`/games`);
        }, 2500);
        setIsLoading(false);
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = async (e) => {
    if (e.key !== "Enter") {
      return;
    }
    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.style.display = member !== "" ? "block" : "none";

    try {
      setIsLoading(true);
      const response = await fetch(apiUrl + `/appuser/search?term=${member}`, {
        method: "get",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const resp = await response.json();
        setSuggestions(resp.appusers || []);
        if (!resp.appusers) {
          const suggestionsList = document.getElementById("suggestions");
          suggestionsList.style.display = "none";
        }
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleSelectItem = (item) => {
    const isItemAlreadySelected = selectedParticipants.some(
      (selected) => selected.idappuser === item.idappuser
    );
    if (!isItemAlreadySelected) {
      const updatedSelectedParticipants = [...selectedParticipants, item];
      setSelectedParticipants(updatedSelectedParticipants);
    }
    setSuggestions([]);
    setMember("");
    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.style.display = "none";
  };

  const handleRemoveItem = (selected) => {
    const updatedSelectedParticipants = [];
    selectedParticipants.forEach((item) => {
      if (item.idappuser !== selected.idappuser) {
        updatedSelectedParticipants.push(item);
      }
    });
    setSelectedParticipants(updatedSelectedParticipants);
    setMember("");
  };
  return (
    <>
      <section>
        <p
          ref={errRef}
          className={`error-message ${errMsg ? "visible" : "hidden"}`}
          aria-live="assertive"
        >
          {errMsg}
        </p>
        <GameDeck onSelectDeck={handleDeckSelect} />
        <div className="input-container">
          <label htmlFor="members">Search Members</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              id="members"
              autoComplete="off"
              value={member}
              onChange={(e) => setMember(e.target.value)}
              onKeyDown={handleInputChange}
              required
              aria-describedby="uidnote"
              className="input-field"
            />
            {isLoading && <div className="spinner small"></div>}
          </div>
          <ul className="suggestions" id="suggestions" ref={suggestionsRef}>
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSelectItem(suggestion)}>
                {suggestion.email}
              </li>
            ))}
          </ul>
        </div>
        <div className="selected-items">
          <h4>Participants:</h4>
          <ul>
            {selectedParticipants.map((item, index) => (
              <li key={index}>
                {item.email}{" "}
                <span
                  className="remove-selected"
                  onClick={() => handleRemoveItem(item)}
                >
                  X
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button className="start-game-button" onClick={handleStartGame}>
          Start Game
        </button>
        <ToastContainer />
      </section>
    </>
  );
}
