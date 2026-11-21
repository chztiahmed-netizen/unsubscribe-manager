export default async function handler(request) {
  const gasUrl = process.env.APPS_SCRIPT_URL;

  if (!gasUrl) {
    return new Response("ERROR: APPS_SCRIPT_URL is missing.", {
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

    // Forward Offer ID and other query parameters.
    target.search = incoming.search;

    const headers = new Headers();
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === "POST"
        ? await request.arrayBuffer()
        : undefined,
      redirect: "follow"
    });

    // Read the complete Google Apps Script response.
    const body = await upstream.text();
console.log("HTML PREVIEW:", body.slice(0, 1200));
    console.log("Apps Script status:", upstream.status);
    console.log("Apps Script content type:",
      upstream.headers.get("content-type"));
    console.log("Apps Script response length:", body.length);

    if (!body.trim()) {
      console.error("Apps Script returned an empty response.");

      return new Response(
        "ERROR: Google Apps Script returned an empty response. HTTP status: " +
        upstream.status,
        {
          status: 502,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ||
          "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });

  } catch (error) {
    console.error("Unsubscribe proxy error:", error);

    return new Response(
      "PROXY ERROR: " + error.message,
      {
        status: 502,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}

export const config = {
  path: "/",
  method: ["GET", "POST"]
};
