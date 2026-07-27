const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   FIREBASE SETUP
========================= */

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();

/* =========================
   GMAIL SETUP
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

/* =========================
   SEND EMAIL
========================= */

async function sendMail(name, amount, decision, email) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Quantum Risk Analyzer",
      html: `
      <h2>Quantum Risk Analyzer</h2>

      <p>Your Portfolio was processed successfully.</p>

      <table border="1" cellpadding="8">
        <tr>
          <th>Stock</th>
          <td>${name}</td>
        </tr>

        <tr>
          <th>Amount</th>
          <td>${amount}</td>
        </tr>

        <tr>
          <th>Decision</th>
          <td>${decision}</td>
        </tr>

      </table>

      <br>

      <b>Thank You.</b>
      `,
    });

    console.log("✅ Email Sent");
  } catch (err) {
    console.log("Mail Error");
    console.log(err);
  }
}
/* =========================
   ADD PORTFOLIO
========================= */

app.post("/add", async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { name, amount, email } = req.body;

    if (!name || !amount || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await db.collection("stocks").add({
      name,
      amount: Number(amount),
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await sendMail(
      name,
      amount,
      "Portfolio Added Successfully ✅",
      email
    );

    res.json({
      success: true,
      message: "Portfolio Added Successfully",
    });
  } catch (err) {
    console.error("ADD ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =========================
   RISK ANALYSIS
========================= */

app.get("/risk", async (req, res) => {
  try {
    const snapshot = await db
      .collection("stocks")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.json({
        success: false,
        message: "No portfolio found",
      });
    }

    const stock = snapshot.docs[0].data();

    const expectedReturn = (Math.random() * 20).toFixed(2);
    const risk = (Math.random() * 10).toFixed(2);

    const decision =
      Number(expectedReturn) > 10 ? "BUY" : "AVOID";

    res.json({
      success: true,
      stock,
      expectedReturn,
      risk,
      decision,
    });
  } catch (err) {
    console.error("RISK ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
/* =========================
   GET ALL PORTFOLIOS
========================= */

app.get("/portfolio", async (req, res) => {
  try {
    const snapshot = await db.collection("stocks").get();

    let data = [];

    snapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(data);
  } catch (err) {
    console.error("PORTFOLIO ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {
  res.send("🚀 Quantum Risk Analyzer Backend Running...");
});

/* =========================
   START SERVER
========================= */

const PORT = 3000;

app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 Quantum Risk Analyzer Started");
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log("==================================");
});
