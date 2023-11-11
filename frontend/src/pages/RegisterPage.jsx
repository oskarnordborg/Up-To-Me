import { useEffect, useRef, useState } from "react";
import * as Passwordless from "@passwordlessdev/passwordless-client";

import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../services/FastAPIClient";
import "./RegisterPage.css";
import { useNavigate } from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL;

export default function RegisterPage() {
  const userRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const errRef = useRef();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [email]);

  const createAppUser = async (userid) => {
    try {
      await fetch(apiUrl + `/appuser/`, {
        method: "post",
        body: JSON.stringify({
          userid: userid,
          email: email,
          firstname: firstName,
          lastname: lastName,
        }),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    let registerToken = null;
    try {
      const fastAPIClient = new FastAPIClient();
      registerToken = await fastAPIClient.register(email, firstName, lastName, {
        timestamp: Date.now(),
      });
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
        console.log(registerToken);
        createAppUser(registerToken.userid);
        setTimeout(() => {
          navigate(`/login/${email}`);
        }, 2500);
      } else {
        toast(`Registration problem ${finalResponse.error?.title || ""}`, {
          type: "error",
        });
      }
    }
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
        <button onClick={handleSubmit} className="registration-button">
          Register
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
