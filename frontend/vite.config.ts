/**
 * ==============================================================================
 * CreditLogic - Credit Scoring & Risk Analysis Engine
 * Author & Intellectual Property Owner: Trigun Parvathapuram
 * All Rights Reserved. Proprietary & Confidential.
 * ==============================================================================
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, /api/* is forwarded to the FastAPI server, so no CORS fuss.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8000" } },
});
