import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { playClick } from "@/lib/sound";
import { initTheme } from "@/lib/theme";

initTheme();

document.addEventListener(
  "click",
  (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("button, a, [role='button'], [role='tab'], label, select")) {
      playClick();
    }
  },
  { capture: true }
);

createRoot(document.getElementById("root")!).render(<App />);
