import { useContext, useEffect, useRef, useState } from "react";
import authContext from "../context/AuthProvider";
import * as Passwordless from "@passwordlessdev/passwordless-client";
import FastAPIClient from "../services/FastAPIClient";
import "./LoginPage.css";

import { ToastContainer, toast } from "react-toastify";

export default function LoginPage() {
  const userRef = useRef();
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const { setAuth } = useContext(authContext);
  const [email, setEmail] = useState("");

  useEffect(() => {
    userRef.current.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordless = new Passwordless.Client({
      apiUrl: process.env.REACT_APP_PASSWORDLESS_API_URL,
      apiKey: process.env.REACT_APP_PASSWORDLESS_API_KEY,
    });
    const fastAPIClient = new FastAPIClient();
    console.log(email);
    let tokenResp = undefined;
    try {
      tokenResp = await passwordless.signinWithDiscoverable();
    } catch (error) {
      toast(error.message, {
        className: "toast-error",
      });
    }

    if (!tokenResp?.token) {
      return;
    }

    const verifiedToken = await fastAPIClient.signIn(tokenResp.token);

    localStorage.setItem("jwt", verifiedToken.jwt);

    setAuth({ verifiedToken });
    setSuccess(true);
  };

  return (
    <>
      {success ? (
        <section>
          <h1 className="success-heading">You are logged in!</h1>
          <p className="success-paragraph">
            {/* <a href="#">Go to Home</a> */}
          </p>
        </section>
      ) : (
        <section>
          <p
            ref={errRef}
            className={`error-message ${errMsg ? "visible" : "hidden"}`}
            aria-live="assertive"
          >
            {errMsg}
          </p>
          <h1 className="sign-in-heading">Sign In</h1>
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
          <button className="sign-in-button" onClick={handleSubmit}>
            Sign In
          </button>
          <p className="need-register">
            Need an Account?
            <br />
            <span className="line">
              <a className="signup-link" href="/register">
                Sign Up
              </a>
            </span>
          </p>
          <ToastContainer />
        </section>
      )}
    </>
  );
}
