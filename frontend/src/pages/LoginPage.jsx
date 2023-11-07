import { useContext, useRef, useState } from "react";
import authContext from "../context/AuthProvider";
import * as Passwordless from "@passwordlessdev/passwordless-client";
import FastAPIClient from "../services/FastAPIClient";
import "./LoginPage.css";

export default function LoginPage() {
  const errRef = useRef();
  const [errMsg, setErrMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const { setAuth } = useContext(authContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const passwordless = new Passwordless.Client({
      apiUrl: process.env.REACT_APP_PASSWORDLESS_API_URL,
      apiKey: process.env.REACT_APP_PASSWORDLESS_API_KEY,
    });
    const fastAPIClient = new FastAPIClient();
    const token = await passwordless.signinWithDiscoverable();
    if (!token) {
      return;
    }
    const verifiedToken = await fastAPIClient.signIn(token.token);

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
        </section>
      )}
    </>
  );
}
