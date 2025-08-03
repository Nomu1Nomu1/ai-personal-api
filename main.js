import e from "express";
import dotenv from "dotenv";
import router from "./routes/web.js";
import cors from "cors";

dotenv.config();

const app = e();
const port = process.env.PORT;

app.use(e.json());
app.use(
  cors({
    origin: `http://localhost:3000`,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(router);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
