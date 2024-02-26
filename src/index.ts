import express, { Request, Response } from 'express';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3005;

app.get('/', (req: Request, res: Response) => {
  res.send('Gyat damn!');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
