import { useEffect, useRef, useState } from "react";
import FastAPIClient from "../services/FastAPIClient";
import ChooseGameDeck from "../components/Decks/ChooseGameDeck";
import "./StartGamePage.css";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../components/RequireAuth";
import { ToastContainer, toast } from "react-toastify";

export default function StartGamePage() {
  const suggestionsRef = useRef(null);
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedChar, setSearchedChar] = useState("");
  const [isLoading, setIsLoading] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const navigate = useNavigate();

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const handleDeckSelect = (deckId) => {
    setSelectedDeck(deckId);
  };

  useEffect(() => {
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
      const response = await fastAPIClient.post("/game/", {
        external_id: userId,
        deck: selectedDeck,
        participants: selectedParticipants.map((item) => item.idappuser),
      });
      if (!response.error) {
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
        console.error("Failed to start game: " + response.error);
        toast("Game created!", {
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

  const searchMembers = async (e) => {
    try {
      setIsLoading(true);
      const response = await fastAPIClient.get(
        `/appuser/search?term=${searchTerm}`
      );
      if (!response.error) {
        setSuggestions(response.appusers || []);
        if (!response.appusers) {
          const suggestionsList = document.getElementById("suggestions");
          suggestionsList.style.display = "none";
        }
        setIsLoading(false);
        return response.appusers || [];
      } else {
        console.error("Failed to search");
        toast("Failed to search: " + response.error, {
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
