import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,
    Divider
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PeopleIcon from "@mui/icons-material/People";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";

import { useNavigate, useLocation } from "react-router-dom";

const drawerWidth = 240; // Levemente ajustado para dar mais respiro ao texto

const MENU_ITEMS = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Orçamentos", icon: <RequestQuoteIcon />, path: "/orcamentos" },
    { text: "Ordens", icon: <ShoppingCartIcon />, path: "/ordens" },
    { text: "Pedidos", icon: <PrecisionManufacturingIcon />, path: "/pedidos" },
    { text: "Clientes", icon: <PeopleIcon />, path: "/clientes" },
];

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                "& .MuiDrawer-paper": {
                    width: drawerWidth,
                    boxSizing: "border-box",
                    bgcolor: "#121212", // Fundo Dark casado com a tela principal
                    borderColor: "rgba(255, 255, 255, 0.08)", // Borda lateral sutil
                    color: "#fff",
                }
            }}
        >
            {/* Header da Sidebar / Logo da Fábrica */}
            <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                <PrecisionManufacturingIcon sx={{ color: "#90caf9", fontSize: 32 }} />
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 700, letterSpacing: "0.5px" }}>
                    FÁBRICA
                </Typography>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 1 }} />

            {/* Lista de Navegação */}
            <List sx={{ px: 1.5 }}>
                {MENU_ITEMS.map((item) => {
                    // Verifica se a rota atual é igual à do botão para ativar o destaque
                    const isActive = location.pathname === item.path;

                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.8 }}>
                            <ListItemButton
                                onClick={() => navigate(item.path)}
                                sx={{
                                    borderRadius: "8px",
                                    py: 1.2,
                                    px: 2,
                                    bgcolor: isActive ? "rgba(144, 202, 249, 0.12)" : "transparent",
                                    color: isActive ? "#90caf9" : "rgba(255, 255, 255, 0.6)",
                                    transition: "all 0.2s ease-in-out",
                                    "&:hover": {
                                        bgcolor: isActive 
                                            ? "rgba(144, 202, 249, 0.18)" 
                                            : "rgba(255, 255, 255, 0.05)",
                                        color: isActive ? "#90caf9" : "#fff",
                                        "& .MuiListItemIcon-root": {
                                            color: isActive ? "#90caf9" : "#fff",
                                        }
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        color: isActive ? "#90caf9" : "rgba(255, 255, 255, 0.5)",
                                        minWidth: 38,
                                        transition: "color 0.2s ease-in-out"
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontSize: "0.92rem",
                                        fontWeight: isActive ? 600 : 500,
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
}