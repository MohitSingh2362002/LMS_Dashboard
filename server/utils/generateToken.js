import jwt from "jsonwebtoken";

// sessionVersion is embedded so old tokens are instantly rejected when a new login happens
const generateToken = (userId, sessionVersion = 0) =>
  jwt.sign({ userId, sessionVersion }, process.env.JWT_SECRET, { expiresIn: "7d" });

export default generateToken;
