const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbytguN2QN9kbJLw97CL2PL8Oj3hyjhvZ75uOmvjZvSGGUTbdCf1liTCUWf-_YqJ9xCB/exec";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
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

    // Visitor notification endpoint
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
        const data = await request.json();
        const cf = request.cf || {};

        const payload = {

          page: data.page || "/",
          referrer: data.referrer || "Direct",

          country: cf.country || "Unknown",
          region: cf.region || "Unknown",
          city: cf.city || "Unknown",

          device: data.device || "Unknown",
          browser: data.browser || "Unknown",

          timestamp: new Date().toISOString()
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(
            `Google Apps Script returned ${response.status}`
          );
        }

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

    // Serve the existing portfolio
    return env.ASSETS.fetch(request);
  }
};