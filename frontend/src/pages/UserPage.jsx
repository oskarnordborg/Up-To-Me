// import AuthContext from "../context/AuthProvider";
// import { useContext } from "react";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "./UserPage.css";

const apiUrl = process.env.REACT_APP_API_URL;

export default function UserPage() {
  // const { auth } = useContext(AuthContext);
  const { startemail } = useParams();
  const userRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken = jwtDecode(jwt);
      setUserId(decodedToken.user_id);
      fetchUserInfo(decodedToken.user_id);
    }
  }, []);

  const fetchUserInfo = async (userId) => {
    try {
      const response = await fetch(apiUrl + `/appuser/?external_id=${userId}`);
      if (response.ok) {
        const resp = await response.json();
        if (resp) {
          setEmail(resp.email || startemail);
          setFirstName(resp.firstname || "");
          setLastName(resp.lastname || "");
        }
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  const updateAppUser = async () => {
    try {
      const response = await fetch(apiUrl + `/appuser/`, {
        method: "put",
        body: JSON.stringify({
          userid: userId,
          email: email,
          firstname: firstName,
          lastname: lastName,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        toast("Updated info", {
          type: "success",
          autoClose: 1000,
          hideProgressBar: true,
        });
      } else {
        toast("Failed to update user info", {
          type: "error",
          autoClose: 1000,
          hideProgressBar: true,
        });
      }
    } catch (error) {
      toast("Failed to update user info", {
        type: "error",
        autoClose: 1000,
        hideProgressBar: true,
      });
    }
  };

  return (
    <section>
      <h1 className="registration-heading">User info</h1>
      <div className="input-container">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          ref={userRef}
          autoComplete="off"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          required
          aria-describedby="uidnote"
          className="input-field"
        />
      </div>
      <div className="input-container">
        <label htmlFor="firstname">First Name</label>
        <input
          type="text"
          id="firstName"
          ref={firstNameRef}
          autoComplete="off"
          onChange={(e) => setFirstName(e.target.value)}
          value={firstName}
          required
          aria-describedby="uidnote"
          className="input-field"
        />
      </div>
      <div className="input-container">
        <label htmlFor="lastname">Last Name</label>
        <input
          type="text"
          id="lastname"
          ref={lastNameRef}
          autoComplete="off"
          onChange={(e) => setLastName(e.target.value)}
          value={lastName}
          required
          aria-describedby="uidnote"
          className="input-field"
        />
      </div>
      <button onClick={updateAppUser} className="update-button">
        Update info
      </button>
      <ToastContainer />
    </section>
  );
}
