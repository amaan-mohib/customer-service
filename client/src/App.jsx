import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Agent from "./views/Agent";
import CSV from "./views/CSV";
import Customer from "./views/Customer";
import Home from "./views/Home";

function App() {
  return (
    <Routes>
      <Route path="/agent" element={<Agent />}></Route>
      <Route path="/customer" element={<Customer />}></Route>
      <Route path="/csv" element={<CSV />}></Route>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}

export default App;
