import { createApp } from "./app.js";
import logger from "./logger/winston.logger.js";

async function start(): Promise<void> {
  try {
    const PORT = process.env.PORT || 3000;

    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server: ", error);
    process.exit(1);
  }
}

start();
