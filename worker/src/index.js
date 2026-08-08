const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbytguN2QN9kbJLw97CL2PL8Oj3hyjhvZ75uOmvjZvSGGUTbdCf1liTCUWf-_YqJ9xCB/exec";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ==========================================
    // CORS PREFLIGHT
    // ==========================================
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // ==========================================
    // VISITOR NOTIFICATION API
    // ==========================================
    if (url.pathname === "/api/visit") {

      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({
            success: false,
            error: "POST required"
          }),
          {
            status: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }

      try {
        // ------------------------------------------
        // Read visitor request
        // ------------------------------------------
        const data = await request.json();

        // Cloudflare visitor information
        const cf = request.cf || {};

        // ------------------------------------------
        // Build payload for Google Apps Script
        // ------------------------------------------
        const workerSecret = env.VISITOR_SECRET || "";
const payload = {
  secret: workerSecret,

  page: data.page || "/",
  referrer: data.referrer || "Direct",

  country: cf.country || "Unknown",
  region: cf.region || "Unknown",
  city: cf.city || "Unknown",

  device: data.device || "Unknown",
  browser: data.browser || "Unknown",

  timestamp: new Date().toISOString()
};
        // ------------------------------------------
        // Send visitor information to Google Apps Script
        // ------------------------------------------
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        });

        // ------------------------------------------
        // Read Google Apps Script response
        // ------------------------------------------
        const responseText = await response.text();

        console.log(
          "Google Apps Script response:",
          responseText
        );

        // HTTP error
        if (!response.ok) {
          throw new Error(
            `Google Apps Script returned HTTP ${response.status}: ${responseText}`
          );
        }

        // ------------------------------------------
        // Parse Google response
        // ------------------------------------------
        let googleResult;

        try {
          googleResult = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Invalid response from Google Apps Script: ${responseText}`
          );
        }

        // ------------------------------------------
        // Check actual Apps Script result
        // ------------------------------------------
        if (!googleResult.success) {
          throw new Error(
            googleResult.error ||
            "Google Apps Script failed to send email"
          );
        }

        // ------------------------------------------
        // SUCCESS
        // ------------------------------------------
        return new Response(
          JSON.stringify({
            success: true,
            message: "Visitor notification sent"
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );

      } catch (error) {

        // ------------------------------------------
        // ERROR
        // ------------------------------------------
        console.error(
          "Visitor notification error:",
          error
        );

        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          }
        );
      }
    }

    // ==========================================
    // SERVE PORTFOLIO
    // ==========================================
    return env.ASSETS.fetch(request);
  }
};