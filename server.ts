import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
const mysql = require('mysql2');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Portfolio Backend Server is running successfully!');
});


let db: any;

function handleDatabase() {
  db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'portfolio_db',
    port: 3306
  });

  db.connect((err: any) => {
    if (err) {
      console.error('Database connection failed, retrying...', err);
      setTimeout(handleDatabase, 2000); 
    } else {
      console.log('MySQL Connected Successfully!');
    }
  });

  db.on('error', (err: any) => {
    console.error('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      handleDatabase(); 
    } else {
      throw err;
    }
  });
}

handleDatabase();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


app.get('/api/projects', (req: Request, res: Response) => {
  const query = 'SELECT * FROM projects';
  db.query(query, (err: any, results: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});


app.post('/api/projects', (req: Request, res: Response) => {
  const { title, description, image, liveLink } = req.body;
  const query = 'INSERT INTO projects (title, description, image, liveLink) VALUES (?, ?, ?, ?)';
  
  db.query(query, [title, description, image, liveLink], (err: any, result: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Project added successfully!', projectId: result.insertId });
  });
});


app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, message } = req.body;

  try {
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New Portfolio Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});