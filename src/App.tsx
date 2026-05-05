import { Switch, Route } from "wouter";
import Home from "@/pages/Home";

function NotFound() {
  return (
    <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>404 – Page Not Found</h1>
      <a href="/" style={{ color: "#2563eb" }}>Go Home</a>
    </div>
  );
}

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
