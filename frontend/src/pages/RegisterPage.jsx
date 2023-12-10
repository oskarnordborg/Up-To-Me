import { useEffect, useRef, useState } from "react";
import * as Passwordless from "@passwordlessdev/passwordless-client";

import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../services/FastAPIClient";
import "./RegisterPage.css";
import { useNavigate } from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL;

export default function RegisterPage({ toggleLoading }) {
  const userRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const errRef = useRef();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [email]);

  const fastAPIClient = new FastAPIClient();

  const createAppUser = async (userid) => {
    try {
      return await fastAPIClient.post(`/appuser/`, {
        userid: userid,
        username: username,
        email: email,
        firstname: firstName,
        lastname: lastName,
      });
    } catch (error) {
      toast(error.message, {
        className: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    toggleLoading(true);
    setIsLoading(true);
    let registerToken = null;
    try {
      registerToken = await fastAPIClient.register(
        username,
        email,
        firstName,
        lastName
      );
    } catch (error) {
      toast(error.message, {
        className: "error",
      });
    }

    // If an error previously happened, 'registerToken' will be null, so you don't want to register a token.
    if (registerToken) {
      const pwlClient = new Passwordless.Client({
        apiKey: process.env.REACT_APP_PASSWORDLESS_API_KEY,
        apiUrl: process.env.REACT_APP_PASSWORDLESS_API_URL,
      });
      const finalResponse = await pwlClient.register(
        registerToken.token,
        email
      );

      if (finalResponse?.token) {
        toast(`Registered '${email}' redirecting you to login page`, {
          autoClose: 2000,
        });

        const resp = await createAppUser(registerToken.userid);
        if (!resp.error) {
          navigate(`/login/${email}`);
        } else {
          toast("Failed to create user: " + resp.error, {
            type: "error",
            autoClose: 3000,
            hideProgressBar: true,
          });
        }
      } else {
        toast(`Registration problem ${finalResponse.error?.title || ""}`, {
          type: "error",
        });
      }
    }
    toggleLoading(false);
    setIsLoading(false);
  };

  return (
    <>
      <section className="registration-section">
        <p
          ref={errRef}
          className={`error-message ${errMsg ? "visible" : "hidden"}`}
          aria-live="assertive"
        >
          {errMsg}
        </p>
        <h1 className="registration-heading">Register</h1>
        <div className="input-container">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            ref={userRef}
            autoComplete="off"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            required
            aria-describedby="uidnote"
            className="register-input-field"
          />
        </div>
        <div className="input-container">
          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            ref={userRef}
            autoComplete="off"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            aria-describedby="uidnote"
            className="register-input-field"
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
            className="register-input-field"
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
            className="register-input-field"
          />
        </div>
        <button
          onClick={handleSubmit}
          className={`registration-button ${
            isLoading ? "button-disabled" : "button-enabled"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
        <br />
        <a className="signup-link" href="/login">
          Already registered?
        </a>
        <ToastContainer />
      </section>
    </>
  );
}
