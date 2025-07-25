import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const auth = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Token is not valid" });
      }

      if (decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
