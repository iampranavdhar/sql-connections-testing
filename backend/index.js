// server.js
import express from "express";
import bodyParser from "body-parser";
import pgPromise from "pg-promise";
import cors from "cors";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Define the PostgreSQL database configuration
const pgp = pgPromise();

const pgpConfig = {
  host: "localhost",
  port: 5432, // Default PostgreSQL port
  database: "postgres",
  user: "pranav",
  password: "pranav",
};

const db = pgp(pgpConfig);

// Test route to check if the database is connected
app.get("/testDatabaseConnection", async (req, res) => {
  try {
    const result = await db.one("SELECT $1 AS message", [
      "Database is connected",
    ]);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
    res.status(500).json({ error: "Database connection error" });
  }
});

// Route for inserting data into the database
app.post("/insertData", async (req, res) => {
  try {
    const jsonArray = req.body;
    console.log(jsonArray);

    if (!jsonArray || jsonArray.length === 0) {
      throw new Error("JSON data is empty or undefined");
    }

    db.none("DROP TABLE IF EXISTS timetable");

    const tableExists = await db.oneOrNone("SELECT to_regclass('timetable')");

    const tableExistsBoolean = tableExists.to_regclass;

    if (!tableExistsBoolean || tableExistsBoolean === null) {
      console.log("table does not exist");
      const columns = Object.keys(jsonArray[0]);
      columns.forEach((column, index) => {
        columns[index] = column.replace(/\s+/g, "_");
      });
      console.log(columns, "columns1");
      const query1 = `CREATE TABLE timetable (${columns
        .map((column) => `"${column}" text`)
        .join(",")})`;
      const res = await db.none(query1);
      console.log(res, "table created1");
    } else {
      // drop table and create new one
      await db.none("DROP TABLE timetable");
      const columns = Object.keys(jsonArray[0]);
      columns.forEach((column, index) => {
        columns[index] = column.replace(/\s+/g, "_");
      });
      console.log(columns, "columns2");
      const query1 = `CREATE TABLE timetable (${columns
        .map((column) => `"${column}" text`)
        .join(",")})`;
      const res = await db.none(query1);
      console.log(res, "table created2");
    }

    for (let i = 0; i < jsonArray.length; i++) {
      const jsonData = jsonArray[i];

      // insert the each JSON object values into the PostgreSQL database table
      const values = Object.values(jsonData);
      console.log(values, "values");

      const query = `INSERT INTO timetable VALUES (${values
        .map((value) => `'${value}'`)
        .join(",")})`;

      await db.none(query);
    }

    res.status(200).send("Data inserted into PostgreSQL");
  } catch (error) {
    console.error("Error inserting data into PostgreSQL:", error.message);
    res.status(500).send("Error inserting data into PostgreSQL");
  }
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const port = 3005; // You can choose a different port
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
