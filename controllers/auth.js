const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { OAuth2Client } = require("google-auth-library");
const { validationResult } = require("express-validator");
require("dotenv").config({ path: [".env.local"] });

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "postmessage"
);

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!");
    error.statusCode = 422;
    error.data = errors.array();
    return next(error);
  }
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email,
      password: hashedPassword,
      name,
    });
    const result = await user.save();
    res
      .status(201)
      .json({ message: "User created!", user: { _id: result._id } });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found!");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Credentials mismatch!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      userId: user._id.toString(),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.google = async (req, res, next) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: "Authorization code is required!" });
  }
  try {
    const { tokens } = await client.getToken(code);
    console.log(tokens);

    if (!tokens.id_token) {
      return res
        .status(400)
        .json({ message: "No ID Token returned by Google" });
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;

    let user = await User.findOne({ email: email });
    if (!user) {
      user = new User({ email: email, password: null, name: payload.name });
      await user.save();
    }

    const jwtToken = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    console.log(jwtToken);

    res.status(200).json({ token: jwtToken, userId: user._id.toString() });
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Google Login Failed" });
  }
};
