import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`SaveWise backend is running on http://localhost:${env.port}`);
});