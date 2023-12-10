import { useEffect, useRef, useState } from "react";
import FastAPIClient from "../services/FastAPIClient";
import "./FriendshipsPage.css";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../components/RequireAuth";
import { ToastContainer, toast } from "react-toastify";

export default function StartGamePage({ toggleLoading }) {
  const suggestionsRef = useRef(null);
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedChar, setSearchedChar] = useState("");
  const [isLoading, setIsLoading] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [showSlownessMessage, setShowSlownessMessage] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();

  useEffect(() => {
    fetchFriends(userId);
  }, []);

  const fetchFriends = async (userIdParam) => {
    if (userIdParam) {
      toggleLoading(true);
    }
    try {
      const response = await fastAPIClient.get(
        `/friendships/?external_id=${userIdParam || userId}`
      );
      if (!response.error) {
        setPendingRequests(response.pending);
        setFriends(response.friends);
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

    toggleLoading(false);
  };

  const searchMembers = async (term) => {
    try {
      setIsLoading(true);
      const response = await fastAPIClient.get(
        `/appuser/search?term=${term}&external_id=${userId}`
      );
      if (!response.error) {
        setSuggestions(response.appusers || []);
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
    let sugg = suggestions;
    if (searchTerm[0] !== searchedChar) {
      setSearchedChar(searchTerm[0]);
      sugg = await searchMembers(searchTerm[0]);
    }

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
  };

  const handleFriendRequest = async (username) => {
    for (let u of suggestions) {
      if (u.username === username) {
        u.friend = true;
        break;
      }
    }
    setSuggestions([...suggestions]);
    try {
      const response = await fastAPIClient.post(`/friendship/create`, {
        external_id: userId,
        username: username,
      });
      if (!response.error) {
        toast("Friend request sent!", {
          type: "success",
          autoClose: 2000,
          hideProgressBar: true,
        });
        fetchFriends();
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
  const handleConfirmFriend = async (username) => {
    console.log(pendingRequests);
    console.log(username);
    for (let u of pendingRequests) {
      if (u.username === username) {
        u.loading = true;
        break;
      }
    }
    setPendingRequests([...pendingRequests]);
    try {
      const response = await fastAPIClient.put(`/friendship/accept`, {
        external_id: userId,
        username: username,
      });
      if (!response.error) {
        toast("Friend request accepted!", {
          type: "success",
          autoClose: 2000,
          hideProgressBar: true,
        });
        fetchFriends();
      } else {
        console.error("Failed to confirm: " + response.error);
        toast("Failed to confirm: " + response.error, {
          type: "error",
          autoClose: 2000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };
  const handleUnfriend = (selected) => {
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
        <h2>Friends</h2>
        {pendingRequests.length > 0 ? (
          <div>
            <h3>Waiting for you</h3>
            <ul className="friend-list" id="friend-list">
              {pendingRequests.map((friend, index) => (
                <li key={index}>
                  {friend.username}
                  <button
                    onClick={() => handleConfirmFriend(friend.username)}
                    disabled={friend.loading}
                    className={`friend-request-button ${
                      friend.loading ? "disabled" : "enabled"
                    }`}
                  >
                    {friend.loading ? "Confirming..." : "Confirm"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p
          ref={errRef}
          className={`error-message ${errMsg ? "visible" : "hidden"}`}
          aria-live="assertive"
        >
          {errMsg}
        </p>
        <div className="input-container">
          <label htmlFor="members">Search Members</label>
          <div>
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
            {isLoading && <div className="spinner-search"></div>}
          </div>
        </div>
        <ul className="friend-list" id="suggestion-list" ref={suggestionsRef}>
          {filteredSuggestions.map((suggestion, index) => (
            <li key={index}>
              {suggestion.username}
              {!suggestion.friend && (
                <button
                  onClick={() => handleFriendRequest(suggestion.username)}
                  className="friend-request-button enabled"
                  id={suggestion.username}
                >
                  + Add Friend
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="my-friends">
          <h3>My Friends</h3>
          <ul className="friend-list" id="friend-list">
            {friends.map((friend, index) => (
              <li key={index}>
                {friend.username} {!friend.accepted && "pending"}
              </li>
            ))}
          </ul>
        </div>
        <ToastContainer />
      </section>
    </>
  );
}
