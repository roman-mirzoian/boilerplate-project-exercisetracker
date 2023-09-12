const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const MONGO_URL = process.env["MONGO_URL"];
mongoose.connect(MONGO_URL);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    log: [
      {
        description: String,
        duration: {
          type: Number,
          required: true,
        },
        date: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    versionKey: false,
  }
);
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", async function (req, res) {
  try {
    const users = await User.find({});
    const preparedUsers = users.map(({ _id, username }) => ({ _id, username }));
    return res.json(preparedUsers);
  } catch (e) {
    return res.json({ error: "Users not found." });
  }
});

app.post("/api/users", async function (req, res) {
  const newUser = new User({ username: req.body.username });
  try {
    await newUser.save();
    return res.json({ _id: newUser._id, username: newUser.username });
  } catch (e) {
    return res.json({ error: "User not created." });
  }
});

app.post("/api/users/:_id/exercises", async function (req, res) {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  const user = await findUserById(_id);

  const expDate = date ? new Date(date) : new Date();
  const newExercise = {
    username: user.username,
    description: description || "",
    duration: +duration,
    date: expDate.toDateString().toString(),
    _id,
  };
  try {
    user.log.push(newExercise);
    await user.save();
    return res.json(newExercise);
  } catch (e) {
    return res.json({ error: "Exercise not added." });
  }
});

app.get("/api/users/:_id/logs", async function (req, res) {
  const { from, to, limit } = req.query;
  const { _id: userId } = req.params;
  const user = await findUserById(userId);

  let userExercises = user.log.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date,
  }));

  if (from) {
    userExercises = filterByDate(userExercises, "from", from);
  }

  if (to) {
    userExercises = filterByDate(userExercises, "to", to);
  }

  if (limit) {
    userExercises = userExercises.slice(0, limit);
  }

  const log = {
    username: user.username,
    count: userExercises.length,
    _id: userId,
    log: userExercises,
  };
  return res.json(log);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

async function findUserById(id) {
  let user;
  try {
    user = await User.findById(id);
  } catch (e) {
    return res.json({ error: "User not found." });
  }
  return user;
}

function filterByDate(exercises, type, value) {
  return exercises.filter(({ date }) => isDateIncludesQuery(date, type, value));
}

function isDateIncludesQuery(originalDate, queryType, queryValue) {
  let date1 = new Date(originalDate).getTime();
  let date2 = new Date(queryValue).getTime();

  return queryType === "from" ? date1 >= date2 : date1 <= date2;
}
