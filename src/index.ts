import express, { Request, Response } from 'express';
// import 'dotenv/config';
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3005;

// Define a route
app.get('/', (req: Request, res: Response) => {
  res.send('Gyat damn!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
