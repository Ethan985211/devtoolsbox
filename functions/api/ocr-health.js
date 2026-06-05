export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  // Forward to CVM OCR API
  const target = `http://82.156.34.78/api/ocr-health`;

  try {
    const resp = await fetch(target, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'error', message: 'upstream unreachable' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
