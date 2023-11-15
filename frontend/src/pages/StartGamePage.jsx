import { useContext, useEffect, useRef, useState } from "react";
import authContext from "../context/AuthProvider";
import FastAPIClient from "../services/FastAPIClient";
import { jwtDecode } from "jwt-decode";
import ChooseGameDeck from "../components/Decks/ChooseGameDeck";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedChar, setSearchedChar] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
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
      setFilteredSuggestions([]);
      const suggestionsList = document.getElementById("suggestions");
      suggestionsList.style.display = "none";
    }
  };

  const handleStartGame = async (e) => {
    e.preventDefault();

    if (!selectedDeck || selectedParticipants.length === 0) {
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
          navigate(`/mygames`);
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

  const searchMembers = async (e) => {
    console.log("Call");
    try {
      setIsLoading(true);
      const response = await fetch(
        apiUrl + `/appuser/search?term=${searchTerm}`,
        {
          method: "get",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const resp = await response.json();
        setSuggestions(resp.appusers || []);
        if (!resp.appusers) {
          const suggestionsList = document.getElementById("suggestions");
          suggestionsList.style.display = "none";
        }
        setIsLoading(false);
        return resp.appusers || [];
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = async (searchTerm) => {
    if (searchTerm === "") {
      setSuggestions([]);
      setFilteredSuggestions([]);
      setSearchedChar("");
      return;
    }
    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.style.display = searchTerm !== "" ? "block" : "none";
    let sugg = suggestions;
    if (searchTerm[0] !== searchedChar) {
      setSearchedChar(searchTerm[0]);
      sugg = await searchMembers();
    }

    const updatedSuggestions = sugg.filter((suggestion) =>
      suggestion.email.startsWith(searchTerm)
    );
    setFilteredSuggestions(updatedSuggestions);
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
    setSearchTerm("");
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
    setSearchTerm("");
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
        <ChooseGameDeck onSelectDeck={handleDeckSelect} userId={userId} />
        <div className="input-container">
          <label htmlFor="members">Search Members</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              id="members"
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleInputChange(e.target.value);
              }}
              required
              aria-describedby="uidnote"
              className="input-field"
            />
            {isLoading && <div className="spinner small"></div>}
          </div>
          <ul className="suggestions" id="suggestions" ref={suggestionsRef}>
            {filteredSuggestions.map((suggestion, index) => (
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
