import jwt from "jsonwebtoken";
import { Faculty } from "../models/faculty.model.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const token =req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const faculty = await Faculty.findById(decodedToken?._id).select("-password -refreshToken");

    if (!faculty) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    req.user = faculty;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ success: false, message: "Unauthorized: Token verification failed" });
  }
};
