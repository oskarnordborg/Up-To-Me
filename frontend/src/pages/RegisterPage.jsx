import { useEffect, useRef, useState } from "react";
import * as Passwordless from "@passwordlessdev/passwordless-client";

import { ToastContainer, toast } from "react-toastify";
import FastAPIClient from "../services/FastAPIClient";
import "./RegisterPage.css";

export default function RegisterPage() {
  const userRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const errRef = useRef();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [email]);

  const handleSubmit = async (e) => {
    let registerToken = null;
    try {
      const fastAPIClient = new FastAPIClient();
      registerToken = await fastAPIClient.register(email, firstName, lastName);
    } catch (error) {
      toast(error.message, {
        className: "toast-error",
      });
    }

    // If an error previously happened, 'registerToken' will be null, so you don't want to register a token.
    if (registerToken) {
      console.log(process.env);
      const p = new Passwordless.Client({
        apiKey: process.env.REACT_APP_PASSWORDLESS_API_KEY,
        apiUrl: process.env.REACT_APP_PASSWORDLESS_API_URL,
      });
      const finalResponse = await p.register(registerToken.token, email);

      if (finalResponse) {
        toast(`Registered '${email}'!`);
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
        <p>Already registered?</p>
        <ToastContainer />
      </section>
    </>
  );
}
