import express from "express";
import morgan from "morgan";
import cors from "cors";
import mongoose from "mongoose";
import { DATABASE } from "./config.js";

const app = express();

mongoose.set("strictQuery", false)
mongoose
  .connect(DATABASE)
  .then(() => console.log("db connected"))
  .catch((err) => console.log(err));

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    data: "hello from nodejs api",
  });
});

app.listen(4001, () => {console.log("Server runing on 4000")});
