import { Hono } from "hono";
import { authMiddleware } from "./middleware/authmiddleware";
import authApp from "./routes/auth";
import customersApp from "./routes/customers";
import transactionsApp from "./routes/transactions";
import dashboardApp from "./routes/dashboard";
import { cors } from "hono/cors";

const app = new Hono();

// Cors
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);


// Auth routes (no auth middleware needed)
app.route("/auth", authApp);

// Apply auth middleware to all subsequent routes
app.use("*", authMiddleware);

// Protected routes
app.route("/customers", customersApp);
app.route("/transactions", transactionsApp);
app.route("/dashboard", dashboardApp);

export default app;
