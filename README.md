# NodeChatApp

This is a very basic application that makes use of sockets for internal messaging, messages are stored on a MongoDB database. this app makes use of Node.js, MonogoDB, Express.

In the root directory run "node server.js", then move to http://localhost:3000 to access the application. 

const express = require("express");
const bodyParser = require("body-parser");
const { Client } = require("pg");
const app = express();
const PORT = 8080;

// create application/json parser
const jsonParser = bodyParser.json();
app.use(express.urlencoded({ extended: false }));

// DB Connect
const client = new Client({
  user: "postgres",
  host: "localhost",
  database: "Books",
  password: "Console@4096",
  port: 5432,
});

client.connect(function (err) {
  if (err) throw err;
  // Set up user table on start
  const query = `create table IF NOT EXISTS users(
    user_name varchar(100),
    user_id serial,
    user_allotments integer[]
  )`;
  client.query(query);
  console.log("Connected!");
});

// User REST Operations
app.get("/users", async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM users ORDER BY ${req?.query?.orderby || "user_id"}`
    );
    res.send(JSON.stringify(result.rows));
  } catch (err) {
    res.send(`Users could not be fetched :(`);
  }
});

app.post("/add-user", jsonParser, async (req, res) => {
    const query = `INSERT INTO users (user_name) values ('${req.body.user_name}')`;
    try {
      await client.query(query);
      res.send(`User added: ${req.body.user_name}`);
    } catch (err) {
      res.send(`User could not be added :(`);
    }
});

app.put("/update-user-book-allotments", jsonParser, async (req, res) => {
    try {
      let query = `update users SET (user_allotments) values ($1) where user_id = ${req.body.user_id};`;
      console.log(`Updating user with query > ${query}`, Array.isArray(req.body.user_allotments));
      await client.query(query, req.body.user_allotments);
      res.send(`User updated: ${req.body.user_id_id}`);
    } catch (err) {
      res.send(`User could not be updated :( due to ${err}`);
    }
  });

// Books REST Operations
app.get("/books", async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM book ORDER BY ${req?.query?.orderby || "book_id"}`
    );
    res.send(JSON.stringify(result.rows));
  } catch (err) {
    res.send(`Books could not be fetched :(`);
  }
});

app.post("/add-book", jsonParser, async (req, res) => {
  const query = `INSERT INTO book values ('${req.body.book_name}',${req.body.book_rating},${req.body.book_pages})`;
  try {
    await client.query(query);
    res.send(`Book added: ${req.body.book_name}`);
  } catch (err) {
    res.send(`Book could not be added :(`);
  }
});

app.put("/update-book", jsonParser, async (req, res) => {
  try {
    const columns = Object.keys(req.body);
    let query = "update book SET ";
    columns.forEach((column, index, arr) => {
      query =
        query +
        `${column} = '${req.body[column]}'` +
        (arr.length - 1 !== index ? "," : "");
    });
    query = query + `where book_id = ${req.body.book_id};`;
    await client.query(query);
    res.send(`Book updated: ${req.body.book_id}`);
  } catch (err) {
    res.send(`Book could not be updated :(`);
  }
});

app.delete("/delete-book", jsonParser, async (req, res) => {
  try {
    const query = `delete from book where book_id = ${req.body.book_id}`;
    await client.query(query);
    res.send(`Book deleted: ${req.body.book_id}`);
  } catch (err) {
    res.send(`Book could not be deleted :(`);
  }
});

app.listen(PORT, () => {
  `Server started at ${PORT}`;
});
