const Joi = require("joi");
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
const User = require("../models/user");
const UserDto = require("../dto/Userdto");
const bcrypt = require("bcryptjs");
const JWTServices = require("../services/JWTServices");
const RefreshTokenModel = require("../models/Token");
const authController = {
  async register(req, res, next) {
    const registerSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      name: Joi.string().max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().pattern(passwordPattern).required(),
      confirmPassword: Joi.ref("password"),
    });
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, email, password, name } = req.body;
    const emailInUse = await User.exists({ email });
    const nameInUse = await User.exists({ username });
    try {
      if (nameInUse) {
        const error = {
          status: 409,
          message: "Username already in use. Please choose a different one.",
        };
        return next(error);
      }
      if (emailInUse) {
        const error = {
          status: 409,
          message: "Email already in use. Please choose a different one.",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    let accessToken;
    let refreshToken;
    let user;
    try {
      const userToRegister = new User({
        email,
        username,
        name,
        password: hashedPassword,
      });
      user = await userToRegister.save();
      accessToken = JWTServices.SignAccessToken({ _id: user._id }, "30m");
      refreshToken = JWTServices.SignRefreshToken({ _id: user._id }, "60m");
    } catch (error) {
      return next(error);
    }
    await JWTServices.StoreRefreshToken(refreshToken, user._id);
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    let userDto = new UserDto(user);
    return res.status(200).json({ user: userDto, auth: true });
  },
  async login(req, res, next) {
    const loginSchema = Joi.object({
      username: Joi.string().min(5).max(30).required(),
      password: Joi.string().pattern(passwordPattern).required(),
    });
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    const { username, password } = req.body;
    let user;
    try {
      user = await User.findOne({ username });
      if (!user) {
        const error = {
          status: 401,
          message: "Invalid username or password.",
        };
        return next(error);
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        const error = {
          status: 401,
          message: "Invalid username or password.",
        };
        return next(error);
      }
    } catch (error) {
      return next(error);
    }
    const accessToken = JWTServices.SignAccessToken({ _id: user._id }, "30m");
    const refreshToken = JWTServices.SignRefreshToken({ _id: user._id }, "60m");
    try {
      await RefreshTokenModel.updateOne(
        { _id: user._id },
        { token: refreshToken },
        { upsert: true }
      );
    } catch (error) {
      return next(error);
    }
    res.cookie("accessToken", accessToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    res.cookie("refreshToken", refreshToken, {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
    });
    let userDto = new UserDto(user);
    return res.status(200).json({ user: userDto, auth: true });
  },
  async logout(req, res, next) {
    // 1. delete refresh token from db
    const { refreshToken } = req.cookies;

    try {
      await RefreshTokenModel.deleteOne({ token: refreshToken });
    } catch (error) {
      return next(error);
    }

    // delete cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // 2. response
    res.status(200).json({ user: null, auth: false });
  },
  async refresh(req, res, next) {
    //get refresh token from db
    //verify refresh token
    //genrate new token
    //update data from the db
    const orignalRefresh = req.cookies.refreshToken
    let id;
    try {
      id = JWTServices.VerifyRefreshToken(orignalRefresh)._id;

    } catch (e) {
      const error = {
        status: "201",
        message: "unauthorized"
      }

      return next(error)
    }
    try {
      const match = RefreshTokenModel.findOne({ _id: id, token: orignalRefresh })
      if (!match) {
        const error = {
          status: "401",
          message: "unauthorrized"
        }
        return next(error)
      }
    } catch (error) {
      return next(error)
    }
    try {
      const accessToken = JWTServices.SignAccessToken({ _id: id }, "30m")
      const refreshToken = JWTServices.SignRefreshToken({ _id: id }, "60m")

      await RefreshTokenModel.updateOne({ _id: id }, { token: refreshToken })
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true

      })
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true

      })

    } catch (e) {
      return next(e)
    }

    const user = await User.findOne({ _id: id })
    const userDto = new UserDto(user)
    return res.status(200).json({ user: userDto, auth: true })
  }
};

module.exports = authController;
