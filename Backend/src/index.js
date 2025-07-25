import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./database/database.js";
import router from "./routes/routers.js";
import cors from 'cors';
import axios from 'axios';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Middlewares
app.use(express.json());

// 🛠 Self-ping setup
const SELF_URL = process.env.MY_URL;

setInterval(() => {
  axios.get(SELF_URL + '/ping')
    .then(() => console.log('Pinged self to stay awake'))
    .catch(err => console.error('Ping error:', err.message));
}, 10 * 60 * 1000); // Every 10 minutes

app.get('/ping', (req, res) => {
  res.send('Pong');
});

// Get allowed origins from .env
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies or authorization headers
};

app.use(cors(corsOptions));

// Serve uploads from src/upload
app.use("/upload", express.static(path.join(__dirname, "upload")));

connectDB();

const port = process.env.PORT || 5003;
app.use("/api", router);

app.listen(port, () => {
  console.log("Backend Running on port:", port);
});
