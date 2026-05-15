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

  // 构建转发请求头
  const forwardHeaders = new Headers();
  const copyHeaders = ['User-Agent', 'Accept', 'Accept-Language', 'Content-Type', 'Authorization'];
  for (const h of copyHeaders) {
    const v = request.headers.get(h);
    if (v) forwardHeaders.set(h, v);
  }
  if (!forwardHeaders.has('User-Agent')) {
    forwardHeaders.set('User-Agent', 'Mozilla/5.0 (compatible; DevToolsBox/1.0)');
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
