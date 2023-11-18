// import AuthContext from "../context/AuthProvider";
// import { useContext } from "react";
import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "./UserPage.css";
import { getUserId } from "../components/RequireAuth";
import FastAPIClient from "../services/FastAPIClient";

export default function UserPage() {
  // const { auth } = useContext(AuthContext);
  const { startemail } = useParams();
  const userRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const fastAPIClient = new FastAPIClient();
  const userId = getUserId();
  let effectRun = false;

  useEffect(() => {
    if (effectRun === false) {
      effectRun = true;
      fetchUserInfo(userId);
    }
  }, [userId]);

  const fetchUserInfo = async (userId) => {
    try {
      const response = await fastAPIClient.get(
        `/appuser/?external_id=${userId}`
      );
      if (!response.error) {
        if (response) {
          setEmail(response.email || startemail);
          setFirstName(response.firstname || "");
          setLastName(response.lastname || "");
        }
      } else {
        console.error("Failed to fetch user data: " + response.error);
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  const updateAppUser = async () => {
    try {
      const response = await fastAPIClient.put(`/appuser/`, {
        userid: userId,
        email: email,
        firstname: firstName,
        lastname: lastName,
      });
      if (!response.error) {
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
