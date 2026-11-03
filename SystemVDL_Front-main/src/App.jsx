import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./components/Sidebar";
import { Box } from "@mui/material";
import { useLocation } from "react-router-dom";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100vw", overflowX: "hidden" }}>

      {/* Renderiza a Sidebar se não estiver no Login */}
      {!isLoginPage && <Sidebar />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isLoginPage ? 0 : 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch", // 👈 ALTERADO: "stretch" força as páginas a ocuparem 100% da largura útil
          width: "100%",
          minWidth: 0 // 👈 ADICIONADO: evita conflito de estouro no flexbox
        }}
      >
        <AppRoutes />
      </Box>

    </Box>
  );
}