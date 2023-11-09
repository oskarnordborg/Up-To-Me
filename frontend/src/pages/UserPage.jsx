// import AuthContext from "../context/AuthProvider";
// import { useContext } from "react";
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { setEmitFlags } from "typescript";

const apiUrl = process.env.REACT_APP_API_URL;

export default function UserPage() {
  // const { auth } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      const decodedToken = jwtDecode(jwt);
      fetchUserInfo(decodedToken.user_id);
    }
  }, []);

  const fetchUserInfo = async (user_id) => {
    try {
      const response = await fetch(apiUrl + `/appuser/?external_id=${user_id}`);
      if (response.ok) {
        const resp = await response.json();
        if (resp) {
          setEmail(resp.email);
          setFirstname(resp.firstname);
          setLastname(resp.lastname);
        }
      } else {
        console.error("Failed to fetch cards data");
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  return (
    <section>
      <p>Congrats, you're a user. </p>
      <p>{email}</p>
      <p>{firstname}</p>
      <p>{lastname}</p>
    </section>
  );
}
