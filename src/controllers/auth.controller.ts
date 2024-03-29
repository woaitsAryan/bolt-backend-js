import User from "../models/user.model.js";
import validator from "validator";
import { compareSync, genSaltSync, hashSync } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import catchAsync from "../helpers/catchAsync.js";
import mongoose from "mongoose";
import { Response, Request } from "express";
import getEnv from "../helpers/getEnv.js";

export const Registercontroller = catchAsync(
  async (req: Request, res: Response) => {
    let { username, password, isTeacher, name, email, institution_name  } = req.body;
    username = username.trim();
    password = password.trim();

    if (!validator.isAlphanumeric(username)) {
      return res
        .status(400)
        .json({ token: "", error: "Username must be alphanumeric" });
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 0,
        minUppercase: 0,
        minNumbers: 1,
        minSymbols: 0,
        returnScore: false,
      })
    ) {
      return res.status(400).json({
        token: "",
        error:
          "Password must be at least 8 characters long and contain at least 1 number",
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ token: "", error: "Username already exists" });
    }
    const salt = genSaltSync(10);
    const hashedpassword = hashSync(password, salt);
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      passwordHash: hashedpassword,
      isTeacher,
      name,
      email,
      institution_name,
    });
    await newUser.save();
    const token = jwt.sign({ userID: newUser._id }, getEnv.JWT_KEY, {
      expiresIn: "30d",
    });
    const returnpayload = { token: token, error: "" };
    return res.json(returnpayload);
  }
);

export const Logincontroller = catchAsync(
  async (req: Request, res: Response) => {
    let { username, password } = req.body;
    username = username.trim();
    password = password.trim();

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    const result = compareSync(password, user.passwordHash);
    if (!result) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    const token = jwt.sign({ userID: user._id }, getEnv.JWT_KEY, {
      expiresIn: "30d",
    });
    return res.json({ token });
  }
);