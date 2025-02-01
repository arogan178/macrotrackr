import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

export default function RegisterPage() {
  const navigate = useNavigate();

  const handleRegister = async (credentials: {
    email: string;
    password: string;
  }) => {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const { token } = await response.json();
    localStorage.setItem("token", token);
    navigate("/overview");
  };

  return <AuthForm mode="register" onSubmit={handleRegister} />;
}
