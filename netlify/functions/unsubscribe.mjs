
export default async function handler(request) {
  const gasUrl = process.env.APPS_SCRIPT_URL;

  if (!gasUrl) {
    return new Response("Backend configuration missing.", {
      status: 500
    });
  }

  if (!["GET", "POST"].includes(request.method)) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, POST" }
    });
  }

  try {
    const incoming = new URL(request.url);
    const target = new URL(gasUrl);

    // Forward query parameters, including the Offer ID.
    target.search = incoming.search;

    const headers = new Headers();
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const response = await fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === "POST"
        ? await request.arrayBuffer()
        : undefined,
      redirect: "follow"
    });

    const responseHeaders = new Headers();

    responseHeaders.set(
      "Content-Type",
      response.headers.get("Content-Type") ||
      "text/html; charset=utf-8"
    );

    responseHeaders.set("Cache-Control", "no-store");
    responseHeaders.set("X-Content-Type-Options", "nosniff");

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });

  } catch (error) {
    console.error("Unsubscribe proxy error:", error);

    return new Response(
      "Unsubscribe service temporarily unavailable.",
      {
        status: 502,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}

// Route the public website root to this function.
export const config = {
  path: "/",
  method: ["GET", "POST"]
};
