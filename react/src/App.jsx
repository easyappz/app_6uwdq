import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import "./App.css";

function App() {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.handleRoutes === "function") {
      window.handleRoutes(["/"]);
    }
  }, []);

  return (
    <div className="App" data-easytag="id24-react/src/App.jsx">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
