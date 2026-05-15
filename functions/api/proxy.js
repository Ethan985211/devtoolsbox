/**
 * DevToolsBox Reverse Proxy
 * 通过 Cloudflare 边缘网络中转访问外网资源
 * 用法: /api/proxy?url=https://www.google.com
 */

// 允许转发的目标域名白名单
const ALLOWED_DOMAINS = [
  // 搜索引擎
  'google.com', 'www.google.com',
  // GitHub
  'github.com', 'api.github.com', 'raw.githubusercontent.com',
  'objects.githubusercontent.com',
  // X / Twitter
  'x.com', 'twitter.com', 'api.x.com', 'api.twitter.com',
  // AI
  'chatgpt.com', 'chat.openai.com', 'api.openai.com',
  'claude.ai', 'api.anthropic.com',
  // 开发资源
  'stackoverflow.com', 'www.stackoverflow.com',
  'reddit.com', 'www.reddit.com',
  'medium.com', 'www.medium.com',
  // 通用
  'ip.sb', 'ifconfig.me', 'httpbin.org',
];

function isAllowed(hostname) {
  return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
}

export async function onRequest(context) {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get('url');

  // OPTIONS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  if (!targetUrl) {
    return new Response(JSON.stringify({
      error: 'Missing url parameter',
      usage: '/api/proxy?url=https://www.google.com',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 解析目标 URL
  let target;
  try {
    target = new URL(targetUrl);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 白名单检查
  if (!isAllowed(target.hostname)) {
    return new Response(JSON.stringify({
      error: 'Domain not in allowlist',
      hostname: target.hostname,
      allowed: ALLOWED_DOMAINS,
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 构建转发请求头（伪装成浏览器以降低被限流概率）
  const forwardHeaders = new Headers();
  
  // 优先用用户自己的 UA
  const userUA = request.headers.get('User-Agent');
  forwardHeaders.set('User-Agent', userUA ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36');
  
  forwardHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
  forwardHeaders.set('Accept-Language', request.headers.get('Accept-Language') || 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7');
  forwardHeaders.set('Accept-Encoding', 'gzip, deflate, br');
  
  if (request.headers.get('Content-Type')) {
    forwardHeaders.set('Content-Type', request.headers.get('Content-Type'));
  }
  if (request.headers.get('Authorization')) {
    forwardHeaders.set('Authorization', request.headers.get('Authorization'));
  }

  // 转发
  try {
    const fetchInit = {
      method: request.method,
      headers: forwardHeaders,
      redirect: 'follow',
    };

    if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
      fetchInit.body = await request.arrayBuffer();
    }

    const response = await fetch(target.toString(), fetchInit);

    // 429 Too Many Requests — 等 2 秒重试一次
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 2000));
      const retryResponse = await fetch(target.toString(), fetchInit);
      if (retryResponse.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limited (429)',
          hint: 'The target server is rate-limiting. Wait a few seconds and try again.',
          target: targetUrl,
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      // Use retry response below
      const responseHeaders2 = new Headers(retryResponse.headers);
      responseHeaders2.set('Access-Control-Allow-Origin', '*');
      responseHeaders2.set('X-Proxy-By', 'DevToolsBox');
      responseHeaders2.set('X-Retry', 'true');
      responseHeaders2.delete('Content-Security-Policy');
      responseHeaders2.delete('X-Frame-Options');
      return new Response(retryResponse.body, {
        status: retryResponse.status,
        statusText: retryResponse.statusText,
        headers: responseHeaders2,
      });
    }

    // 回传响应
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Proxy-By', 'DevToolsBox');
    // 移除可能导致问题的安全头
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('X-Frame-Options');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: 'Upstream request failed',
      detail: e.message,
      target: targetUrl,
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
