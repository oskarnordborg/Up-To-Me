import { useEffect, useRef, useState } from "react";
import * as Passwordless from "@passwordlessdev/passwordless-client";
import {
  PASSWORDLESS_API_KEY,
  PASSWORDLESS_API_URL,
} from "../configuration/PasswordlessOptions";
import { ToastContainer, toast } from "react-toastify";
import YourBackendClient from "../services/YourBackendClient";
import "./RegisterPage.css";

export default function RegisterPage() {
  const userRef = useRef();
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const aliasRef = useRef();
  const errRef = useRef();
  const [user, setUser] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [alias, setAlias] = useState("");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    userRef.current.focus();
  }, []);

  useEffect(() => {
    setErrMsg("");
  }, [user]);

  const handleSubmit = async (e) => {
    let registerToken = null;
    try {
      const yourBackendClient = new YourBackendClient();
      registerToken = await yourBackendClient.register(
        user,
        firstName,
        lastName,
        alias
      );
    } catch (error) {
      toast(error.message, {
        className: "toast-error",
      });
    }

    // If an error previously happened, 'registerToken' will be null, so you don't want to register a token.
    if (registerToken) {
      const p = new Passwordless.Client({
        apiKey: PASSWORDLESS_API_KEY,
        apiUrl: PASSWORDLESS_API_URL,
      });
      const finalResponse = await p.register(registerToken.token, alias);

      if (finalResponse) {
        toast(`Registered '${alias}'!`);
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
            onChange={(e) => setUser(e.target.value)}
            value={user}
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
        <div className="input-container">
          <label htmlFor="alias">Alias</label>
          <input
            type="text"
            id="alias"
            ref={aliasRef}
            autoComplete="off"
            onChange={(e) => setAlias(e.target.value)}
            value={alias}
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
