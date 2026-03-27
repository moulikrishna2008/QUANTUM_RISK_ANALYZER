const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let portfolio = []; // temporary DB

// Add stock
app.post("/add", (req, res) => {
  const { name, amount } = req.body;

  portfolio.push({ name, amount });

  res.json({ message: "Added", portfolio });
});

// Get portfolio
app.get("/portfolio", (req, res) => {
  res.json(portfolio);
});

// Risk simulation
app.get("/risk", (req, res) => {
  let scenarios = 100;
  let results = [];

  for (let i = 0; i < scenarios; i++) {
    let change = (Math.random() - 0.5) * 20;
    results.push(change);
  }

  let worst = Math.min(...results);
  let avg = results.reduce((a, b) => a + b, 0) / scenarios;

  res.json({
    risk: worst.toFixed(2),
    return: avg.toFixed(2)
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});