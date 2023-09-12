const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");

const users = [];
const exercises = [];

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", function (req, res) {
  const newUser = {
    username: req.body.username,
    _id: (Math.random() * 100).toFixed(0),
  };
  users.push(newUser);
  return res.json(newUser);
});

app.get("/api/users", function (req, res) {
  res.json(users);
});

app.post("/api/users/:_id/exercises", function (req, res) {
  const { description, duration, date } = req.body;
  const { _id } = req.params;

  const user = findUserById(_id);
  if (!user) {
    return res.json({ error: "Invalid user id" });
  }

  const expDate = date ? new Date(date) : new Date();
  const newExercise = {
    username: user.username,
    description: description || "",
    duration: +duration,
    date: expDate.toDateString().toString(),
    _id,
  };

  exercises.push(newExercise);
  return res.json(newExercise);
});

app.get("/api/users/:_id/logs", function (req, res) {
  const { from, to, limit } = req.query;
  const { _id } = req.params;
  const user = findUserById(_id);
  if (!user) {
    return res.json({ error: "Invalid user id" });
  }

  let userExercises = exercises
    .filter((ex) => ex._id === _id)
    .map((ex) => ({
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
    _id,
    log: userExercises,
  };
  return res.json(log);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

function findUserById(id) {
  return users.find(({ _id }) => _id === id);
}

function filterByDate(exercises, type, value) {
  return exercises.filter(({ date }) => isDateIncludesQuery(date, type, value));
}

function isDateIncludesQuery(originalDate, queryType, queryValue) {
  let date1 = new Date(originalDate).getTime();
  let date2 = new Date(queryValue).getTime();

  return queryType === "from" ? date1 >= date2 : date1 <= date2;
}
