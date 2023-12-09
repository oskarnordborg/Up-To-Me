import { useEffect, useRef, useState } from "react";
import FastAPIClient from "../services/FastAPIClient";
import ChooseGameDeck from "../components/Decks/ChooseGameDeck";
import GameSettingsModal from "../components/GameSettingsModal";
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
  const [openGameSettings, setOpenGameSettings] = useState(null);
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  const handleDeckSelect = (deck) => {
    setSelectedDeck(deck);
  };

  useEffect(() => {
    fetchFriends(true);
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const fetchFriends = async (setSuggestions = false) => {
    try {
      const response = await fastAPIClient.get(
        `/friends/?external_id=${userId}`
      );
      if (!response.error) {
        setFriends(response.friends);
        if (setSuggestions) {
          setFilteredSuggestions(response.friends);
        }
      } else {
        console.error("Failed to fetch friends data: " + response.error);
        toast("Failed to fetch friends data: " + response.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  const handleClickOutside = (e) => {
    const memberInput = document.getElementById("search-members-input");
    if (
      suggestionsRef.current &&
      !suggestionsRef.current.contains(e.target) &&
      !memberInput.contains(e.target)
    ) {
      const suggestionsList = document.getElementById("suggestion-list");
      suggestionsList.style.display = "none";
    }
  };
  const openGameSettingsModal = () => {
    setOpenGameSettings(true);
  };
  const closeCardModal = () => {
    setOpenGameSettings(false);
  };

  const handleGameSettingsClick = async (e) => {
    e.preventDefault();

    if (!selectedDeck || selectedParticipants.length === 0) {
      toast("Please choose a deck and at least one member", {
        type: "warning",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }
    openGameSettingsModal();
  };

  const handleSearchFocus = () => {
    const suggestionsList = document.getElementById("suggestion-list");
    suggestionsList.style.display = "block";
  };

  const handleInputChange = async (searchTerm) => {
    let sugg = friends;
    const updatedSuggestions = sugg.filter((suggestion) =>
      suggestion.username.toLowerCase().startsWith(searchTerm.toLowerCase())
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
    const suggestionsList = document.getElementById("suggestion-list");
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
        {openGameSettings && (
          <GameSettingsModal
            deck={selectedDeck}
            participants={selectedParticipants}
            closeFunction={closeCardModal}
          />
        )}
        <div className="input-container">
          <label htmlFor="search-members-input">Search Friends</label>
          <div>
            <input
              type="text"
              id="search-members-input"
              autoComplete="off"
              value={searchTerm}
              onFocus={handleSearchFocus}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleInputChange(e.target.value);
              }}
              required
              aria-describedby="uidnote"
              className="input-field"
            />
            {isLoading && <div className="spinner-search"></div>}
          </div>
          <ul className="suggestions" id="suggestion-list" ref={suggestionsRef}>
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion, index) => (
                <li key={index} onClick={() => handleSelectItem(suggestion)}>
                  {suggestion.username}
                </li>
              ))
            ) : (
              <li>
                No hits&nbsp;&nbsp;
                <a className="find-friends-link" href="/friendships">
                  Find more friends?
                </a>
              </li>
            )}
          </ul>
        </div>
        <div className="selected-items">
          <h4>Participants:</h4>
          <ul>
            {selectedParticipants.map((item, index) => (
              <li key={index}>
                {item.username}{" "}
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
        <button
          className="game-settings-button"
          onClick={handleGameSettingsClick}
        >
          Game Settings
        </button>
        <ToastContainer />
      </section>
    </>
  );
}
