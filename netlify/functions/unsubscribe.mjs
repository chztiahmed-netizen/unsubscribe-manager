
export default async function handler(request) {
  const gasUrl = process.env.APPS_SCRIPT_URL;

  if (!gasUrl) {
    return Response.json(
      { ok: false, message: "Backend configuration missing." },
      { status: 500 }
    );
  }

  if (!["GET", "POST"].includes(request.method)) {
    return Response.json(
      { ok: false, message: "Method not allowed." },
      { status: 405 }
    );
  }

  try {
    const incoming = new URL(request.url);
    const target = new URL(gasUrl);

    if (request.method === "GET") {
      target.searchParams.set("offer", incoming.searchParams.get("offer") || "");
    } else {
      target.searchParams.set("action", "unsubscribe");
    }

    const headers = {
      Accept: "application/json"
    };

    let body;

    if (request.method === "POST") {
      headers["Content-Type"] = "application/json";
      body = await request.text();
    }

    const upstream = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
      redirect: "follow"
    });

    const responseText = await upstream.text();

    console.log("Apps Script status:", upstream.status);
    console.log("Apps Script final URL:", upstream.url);
    console.log("Apps Script response:", responseText.slice(0, 1000));

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(
        "Apps Script did not return valid JSON. Check its deployment."
      );
    }

    return Response.json(result, {
      status: upstream.ok ? 200 : 502,
      headers: {
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    console.error("Unsubscribe API error:", error);

    return Response.json(
      {
        ok: false,
        message: error.message || "Unsubscribe service unavailable."
      },
      { status: 502 }
    );
  }
}
