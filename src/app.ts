import express from "express";
import morgan from "morgan";
import helmet from "helmet";

import cors from "cors";

// eslint-disable-next-line @typescript-eslint/no-var-requires
import * as dotenv from "dotenv";
dotenv.config();

import api from "./api";
import { errorHandler } from "./middlewares";
import path from "path";

const App = express();

// For rate limiting headers
App.set("trust proxy", 1);

App.use(
  morgan(
    ":date[web] :method :remote-addr :url :status :response-time ms - :res[content-length]"
  )
);

App.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'", "'unsafe-inline'", "https://www.youtube.com/"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "frame-src": ["https://www.youtube.com/", "'self'"],
        "img-src": ["'self'", "https://i.ytimg.com/"],
      },
    },
  })
);
App.use(cors());
App.use(express.json());

App.use("/api", api);
App.get("/:page", (req, res) => {
  console.log(req.path);

  res.sendFile(path.join(__dirname, "../pages", req.params.page));
});

App.use(errorHandler);

export default App;
