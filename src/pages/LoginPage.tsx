import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  const handleLogin = async (credentials: {
    email: string;
    password: string;
  }) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Login failed");
      }

      const { token } = await response.json();
      localStorage.setItem("token", token);
      window.location.href = "/overview"; // Force full refresh
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  return <AuthForm mode="login" onSubmit={handleLogin} />;
}
