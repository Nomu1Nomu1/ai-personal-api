import e from 'express';
import dotenv from 'dotenv';
import router from './routes/web.js';

dotenv.config();

const app = e();
const port = process.env.PORT;

app.use(e.json());

app.use(router);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});