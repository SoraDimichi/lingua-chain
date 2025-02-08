import { StrictMode } from "react";
import "./index.css";
import App from "./App.tsx";
import { createRoot } from "react-dom/client";
import { Web3Provider } from "./context.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Web3Provider>
      <App />
    </Web3Provider>
  </StrictMode>,
);
