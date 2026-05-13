import express, { type Express } from "express";
import morganMiddleware from "./logger/morgan.logger.js";

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(morganMiddleware);

  app.get("/health", (req, res) => {
    res.json({ message: "OK" });
  });

  return app;
}
