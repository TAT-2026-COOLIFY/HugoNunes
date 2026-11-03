import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

export default function PrivateRoute() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    // Verificamos o token assim que o componente é montado
    const token = localStorage.getItem("token");
    setAuth(!!token);
  }, []);

  // Enquanto não verificamos o token, não renderizamos nada (ou um loading)
  if (auth === null) {
    return null; 
  }

  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}