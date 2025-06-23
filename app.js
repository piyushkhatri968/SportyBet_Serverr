const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const app = express();
const otpRoutes = require("./routes/authRoutes");
const betRoute = require("./routes/betRoute");
const multibet = require("./routes/multibetRoutes");
const depositRoute = require("./routes/depositeRoute.js");
const verifycodeRoute = require("./routes/verifyCodeRoute.js");
const oddRoute = require("./routes/oddRoute.js");
const cashOut = require("./routes/cashoutRoute.js");
const imageRoutes = require("./routes/ImageRoute.js")
const matchesRoutes = require("./routes/matchesRoute.js")
const topmatchesRoutes = require("./routes/topMatchRoute.js")
const WalletRoutes = require("./routes/wallet.js")
const WinningRoutes = require("./routes/winningRoute.js")
const addonRoutes = require("./routes/addonRoute.js")
const useraddonRoutes = require("./routes/userAddonRoute.js")
const proImgRoutes = require("./routes/profileImageRoute.js")
const userImgRoutes = require("./routes/UserImageRoute.js")
const BookingRoutes = require("./routes/BookingRoute.js")
const path = require("path")

// Middleware for parsing JSON
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(
  cors({
    origin: "*", // Replace with your frontend URL
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
// Register the routes

app.get("/api", (req, res) => {
  res.json({ message: "API running successfully" });
});

app.use("/api", otpRoutes);
app.use("/api", betRoute);
app.use("/api", multibet);
// app.use("/api", depositRoute);
app.use("/api", verifycodeRoute);
app.use("/api", oddRoute);
app.use("/api", cashOut);
app.use("/api", imageRoutes);
app.use("/api", matchesRoutes);
app.use("/api", topmatchesRoutes);
app.use("/api", WalletRoutes);
app.use("/api", WinningRoutes);
app.use("/api", addonRoutes);
app.use("/api", useraddonRoutes);
app.use("/api", proImgRoutes);
app.use("/api", userImgRoutes);
app.use("/api", BookingRoutes);


// Connect to MongoDB (replace with your own URI)
mongoose
  .connect(process.env.MONGO_URL , {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
