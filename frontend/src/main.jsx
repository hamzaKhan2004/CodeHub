import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProjectRoutes from "./Routes";
import { BrowserRouter as Router } from "react-router";

createRoot(document.getElementById("root")).render(
    <ThemeProvider>
        <AuthProvider>
            <Router>
                <ProjectRoutes />
            </Router>
        </AuthProvider>
    </ThemeProvider>
);
