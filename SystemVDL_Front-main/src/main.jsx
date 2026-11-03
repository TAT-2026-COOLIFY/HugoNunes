import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material"
import { SnackbarProvider } from "notistack" // 👈 Importação adicionada

import App from './App.jsx'
import "./index.css"

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        {/* 🍿 SnackbarProvider configurado para o tema dark */}
        <SnackbarProvider 
          maxSnack={3} 
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={4000}
        >
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)