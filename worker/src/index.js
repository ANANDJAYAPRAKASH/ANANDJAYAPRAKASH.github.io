export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle visitor API
    if (url.pathname === "/api/visit") {
      // CORS preflight
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

      // Only accept POST
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
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Visitor endpoint is working",
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Serve your existing portfolio
    return env.ASSETS.fetch(request);
  }
};