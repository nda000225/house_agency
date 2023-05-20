import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import { DATABASE, PORT } from "./config.js";
import authRoutes  from './routes/auth.js'


const app = express();

mongoose.set("strictQuery", false)
mongoose
  .connect(DATABASE)
  .then(() => console.log("db connected"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());


app.use("/api", authRoutes)
app.get("/", (req, res) => {
  res.json({
    data: "hello from nodejs api",
  });
});

app.listen(PORT, () => {console.log(`Server runing on ${PORT}`)});
