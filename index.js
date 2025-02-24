import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from 'cors'
import initApp from "./src/app.router.js";

// Set directory dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "./config/.env") });
const app = express();
const port = process.env.PORT;
app.use(cors())


initApp(app, express);

app.listen(port, () => {
  console.log(`Server is running on port.......${port}`);
});
