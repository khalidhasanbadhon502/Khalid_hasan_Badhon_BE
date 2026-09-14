import express, { Request, Response } from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import mysql from "mysql2";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("MySQL Connected Successfully!");
    connection.release();
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Portfolio Backend Server is running successfully!");
});

app.get("/api/projects", (req: Request, res: Response) => {
  const query = "SELECT * FROM projects";

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching projects:", err);

      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    res.status(200).json({
      success: true,
      projects: results
    });
  });
});

app.post("/api/projects", (req: Request, res: Response) => {
  const { title, description, image, liveLink } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: "Title and description are required."
    });
  }

  const query = `
    INSERT INTO projects
    (title, description, image, liveLink)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    query,
    [title, description, image, liveLink],
    (err, result: any) => {
      if (err) {
        console.error("Error adding project:", err);

        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      res.status(201).json({
        success: true,
        message: "Project added successfully!",
        projectId: result.insertId
      });
    }
  );
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/api/contact", async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: "Name, email and message are required."
    });
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `New Portfolio Message from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Email sent successfully!"
    });
  } catch (error) {
    console.error("Email error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send email"
    });
  }
});

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});