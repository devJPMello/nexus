import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import logoWhite from "../assets/images/logo-branca.svg";
import "./login.css";

const LoginScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-left-side">
        <div className="login-card">
          <h1 className="login-title">Bem-vindo de volta</h1>
          <p className="login-subtitle">Escolha uma opção para continuar</p>
          <div className="clerk-signin-wrapper">
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: {
                    backgroundColor: "#2A4494",
                    "&:hover": {
                      backgroundColor: "#224870"
                    }
                  },
                  card: {
                    boxShadow: "none",
                    border: "none",
                    backgroundColor: "transparent"
                  },
                  headerTitle: {
                    display: "none"
                  },
                  headerSubtitle: {
                    display: "none"
                  },
                  socialButtonsBlockButton: {
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                    "&:hover": {
                      backgroundColor: "#f9fafb"
                    }
                  },
                  dividerLine: {
                    backgroundColor: "#e5e7eb"
                  },
                  dividerText: {
                    color: "#6b7280"
                  },
                  formFieldInput: {
                    border: "1px solid #d1d5db",
                    "&:focus": {
                      borderColor: "#2A4494",
                      boxShadow: "0 0 0 3px rgba(42, 68, 148, 0.1)"
                    }
                  },
                  footerActionLink: {
                    color: "#2A4494",
                    "&:hover": {
                      color: "#224870"
                    }
                  }
                }
              }}
              redirectUrl="/"
              afterSignInUrl="/"
            />
          </div>
        </div>
      </div>

      <div className="login-right-side">
        <div className="welcome-wrap">
          <img src={logoWhite} alt="Logo" className="logo-img" />
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;