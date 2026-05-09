import jwt from "jsonwebtoken";

import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    // get token
    const token = req.headers.authorization;

    // token missing
    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // remove Bearer
    const realToken = token.split(" ")[1];

    // verify token
    const decoded = jwt.verify(
      realToken,
      process.env.JWT_SECRET
    );

    // find user
    req.user = await User.findById(decoded.id).select(
      "-password"
    );

    next();
  } catch (error) {
    res.status(401).json({
      message: "Unauthorized",
    });
  }
};

export default protect;