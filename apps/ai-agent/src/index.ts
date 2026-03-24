import express from "express";
import pino from "pino";
import { config } from "./config.js";
import healthRouter from "./routes/health.js";
import aiTurnRouter from "./routes/aiTurn.js";

const logger = pino({ level: config.logLevel });

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/health", healthRouter);
app.use("/ai", aiTurnRouter);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error({ error: err.message, stack: err.stack }, "Unhandled error");
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: err.message,
    });
  }
);

app.listen(config.port, () => {
  logger.info({ port: config.port }, "AI Agent server started");
});

export { app };
