import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";   // ✅ Correct import
import axios from "axios";
import { API_URL } from "../services/api";

function GoogleButton({ onLoginSuccess }) {
  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          const decoded = jwtDecode(credentialResponse.credential); // ✅ Correct usage
          const email = decoded.email;

          // ✅ Send email to backend
          const res = await axios.post(`${API_URL}/auth/google-login`, { email });

          if (res.data.success) {
            // ✅ Save token
            localStorage.setItem("token", res.data.token);

            // ✅ Pass user & token back to parent (Login/Register page)
            onLoginSuccess(res.data.user, res.data.token);
          }
        } catch (error) {
          alert("Google Login Error");
          console.log(error);
        }
      }}
      onError={() => {
        alert("Google Login Failed");
      }}
      text="continue_with"
    />
  );
}

export default GoogleButton;

