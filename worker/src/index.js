export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/api/visit") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Visitor endpoint is working",
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    return new Response("Anand Jayaprakash — Visitor API", {
      headers: {
        "Content-Type": "text/plain"
      }
    });
  }
};