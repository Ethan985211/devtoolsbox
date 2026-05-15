/**
 * DevToolsBox Reverse Proxy v3
 * Cloudflare Pages Function — 边缘网络中转代理
 * 用法: /api/proxy?url=https://example.com
 *
 * v3 新特性：HTML URL 重写。代理返回的 HTML 中所有资源链接（CSS/JS/图片/跳转）
 * 自动改写为走代理，解决国内加载慢和链接跳转失败问题。
 *
 * 已知硬限制：Cloudflare Workers 的 fetch() 在访问同样受 Cloudflare Bot
 * 防护的站点时会被 1010 浏览器签名检测拦截。Google 搜索、GitHub.com、
 * Reddit 等站点无法代理。方案：提供替代端点（Google News、GitHub Raw 等）。
 */

// ============== 白名单 ==============
const ALLOWED_DOMAINS = [
  // 搜索引擎 & 新闻
  'google.com', 'www.google.com', 'news.google.com',
  'duckduckgo.com', 'www.duckduckgo.com',
  'bing.com', 'www.bing.com',
  'wikipedia.org', 'en.wikipedia.org', 'zh.wikipedia.org',
  // GitHub（raw/objects 可行，web/api 被 Cloudflare 封）
  'github.com', 'api.github.com',
  'raw.githubusercontent.com', 'objects.githubusercontent.com',
  'gist.githubusercontent.com',
  // StackExchange
  'stackoverflow.com', 'www.stackoverflow.com',
  'superuser.com', 'serverfault.com', 'askubuntu.com',
  'stackexchange.com',
  // 开发资源
  'registry.npmjs.org', 'www.npmjs.com',
  'pypi.org', 'pypi.python.org',
  'crates.io',
  'docs.rs',
  // CDN（用于 HTML 内资源重写后加载）
  'cdn.jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com',
  // AI & ML
  'api.openai.com', 'chatgpt.com', 'chat.openai.com',
  'api.anthropic.com', 'claude.ai', 'docs.anthropic.com',
  'huggingface.co',
  // 学术
  'arxiv.org',
  // 博客 & 媒体
  'medium.com', 'www.medium.com',
  'dev.to', 'hashnode.com',
  'reddit.com', 'www.reddit.com', 'old.reddit.com',
  // X / Twitter（API 可用，Web 会封）
  'x.com', 'twitter.com', 'api.x.com', 'api.twitter.com',
  'nitter.net',
  // 工具 & 检测
  'ip.sb', 'ifconfig.me', 'httpbin.org',
  'icanhazip.com', 'api.ipify.org',
  // Cloudflare
  'cloudflare.com', 'developers.cloudflare.com',
  // YouTube（只读搜索可行）
  'www.youtube.com', 'youtube.com',
];

// ============== User-Agent 轮换池 ==============
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:137.0) Gecko/20100101 Firefox/137.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:137.0) Gecko/20100101 Firefox/137.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
];

// ============== 域名 → 定制请求头 ==============
const DOMAIN_HEADERS = {
  'api.github.com': { 'Accept': 'application/vnd.github.v3+json' },
  'registry.npmjs.org': { 'Accept': 'application/json' },
  'pypi.org': { 'Accept': 'application/json' },
  'huggingface.co': { 'Accept': 'application/json' },
  'api.openai.com': { 'Accept': 'application/json' },
  'api.anthropic.com': { 'Accept': 'application/json' },
  'arxiv.org': { 'Accept': 'application/xml;q=0.9, */*;q=0.8' },
};

// ============== 已知被 Cloudflare Bot 拦截的域名 ==============
// chatgpt.com 已移除：允许尝试，让用户看到实际错误而非预判拦截
const KNOWN_BLOCKED = [
  'www.google.com',      // 建议用 news.google.com
  'google.com',          // 同上
  'github.com',          // 建议用 raw.githubusercontent.com
  'www.reddit.com',      // Reddit 有 Cloudflare 严格防护
  'reddit.com',
];

function isAllowed(hostname) {
  return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
}

function isKnownBlocked(hostname) {
  return KNOWN_BLOCKED.includes(hostname);
}

function pickUA() {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

function getDomainHeaders(hostname) {
  return DOMAIN_HEADERS[hostname] || {};
}

// ============== HTML URL 重写 ==============
// 把 HTML 里的绝对/协议相对/根相对 URL 全部改写为走代理，
// 确保 CSS/JS/图片/跳转链接在国内都能加载
const URL_ATTRS = ['src', 'href', 'action', 'poster', 'data-src', 'data-href'];

function rewriteHtml(html, targetHost, proxyPath) {
  const targetOrigin = 'https://' + targetHost;
  const proxyPrefix = proxyPath + '?url=';

  // 1. 构建属性正则，匹配 attr="value" 或 attr='value'
  const attrNames = URL_ATTRS.join('|');
  const attrRegex = new RegExp(
    '(' + attrNames + ')\\s*=\\s*(["\\\'])([^"\\\']*?)\\2',
    'gi'
  );

  html = html.replace(attrRegex, (match, attr, quote, value) => {
    const rewritten = rewriteAttrValue(attr, value, targetOrigin, proxyPrefix, proxyPath);
    return attr + '=' + quote + rewritten + quote;
  });

  // 2. 插入 <base> 标签，让相对路径（./style.css）自动走代理
  const baseHref = proxyPrefix + encodeURIComponent(targetOrigin + '/');
  if (/<base[\s>]/i.test(html)) {
    html = html.replace(
      /(<base\s[^>]*href\s*=\s*)(["'])[^"']*\2/gi,
      '$1$2' + baseHref + '$2'
    );
  } else if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/(<head[^>]*>)/i, '$1\n<base href="' + baseHref + '">');
  } else {
    html = '<base href="' + baseHref + '">\n' + html;
  }

  return html;
}

function rewriteAttrValue(attr, value, targetOrigin, proxyPrefix, proxyPath) {
  const attrLower = attr.toLowerCase();

  if (attrLower === 'srcset') {
    return rewriteSrcset(value, proxyPrefix, proxyPath);
  }

  // data-src 可能包含多个 URL（懒加载库），按逗号分割处理
  if (attrLower === 'data-src') {
    return value.split(',').map(v => rewriteSingleUrl(v.trim(), targetOrigin, proxyPrefix, proxyPath)).join(', ');
  }

  return rewriteSingleUrl(value, targetOrigin, proxyPrefix, proxyPath);
}

function rewriteSingleUrl(url, targetOrigin, proxyPrefix, proxyPath) {
  if (!url) return url;

  // 跳过非 HTTP 协议
  if (
    url.startsWith('#') ||
    url.startsWith('javascript:') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('{{')       // 模板语法，不动
  ) {
    return url;
  }

  // 已经是代理 URL，不重复包裹
  if (url.includes(proxyPath + '?url=')) {
    return url;
  }

  let fullUrl;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    fullUrl = url;
  } else if (url.startsWith('//')) {
    fullUrl = 'https:' + url;
  } else if (url.startsWith('/')) {
    fullUrl = targetOrigin + url;
  } else {
    // 相对路径，由 <base> 标签处理
    return url;
  }

  return proxyPrefix + encodeURIComponent(fullUrl);
}

function rewriteSrcset(value, proxyPrefix, proxyPath) {
  return value.split(',').map(part => {
    const trimmed = part.trim();
    // srcset 格式: "URL 1x" 或 "URL 640w" 或 纯 "URL"
    const m = trimmed.match(/^(\S+)(\s+.+)?$/);
    if (!m) return trimmed;
    let url = m[1];
    const desc = m[2] || '';
    if (url.startsWith('//')) url = 'https:' + url;
    if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes(proxyPath)) {
      return proxyPrefix + encodeURIComponent(url) + desc;
    }
    return trimmed;
  }).join(', ');
}

// ============== 主处理函数 ==============
export async function onRequest(context) {
  const { request } = context;
  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get('url');
  const rawMode = reqUrl.searchParams.get('raw') === 'true';

  // OPTIONS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent, Accept',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 无 url 参数 → 返回状态页
  if (!targetUrl) {
    return new Response(JSON.stringify({
      error: 'Missing url parameter',
      usage: '/api/proxy?url=https://example.com',
      status: 'ok',
      service: 'DevToolsBox Reverse Proxy v3',
    }), {
      status: 200,
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
      hint: 'Contact site owner to add this domain.',
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 已知被拦截域名 → 返回友好提示
  if (isKnownBlocked(target.hostname)) {
    const alternatives = {
      'www.google.com': 'Try news.google.com or use DuckDuckGo',
      'google.com': 'Try news.google.com or use DuckDuckGo',
      'github.com': 'Try raw.githubusercontent.com for file access',
      'www.reddit.com': 'Reddit blocks proxy access. Try old.reddit.com',
      'reddit.com': 'Reddit blocks proxy access. Try old.reddit.com',
    };
    return new Response(JSON.stringify({
      error: 'This site blocks proxy access (Cloudflare Bot Protection)',
      hostname: target.hostname,
      hint: alternatives[target.hostname] || 'Use an alternative endpoint or API',
      blocked: true,
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // 构建转发请求头
  const forwardHeaders = new Headers();

  // User-Agent: 优先用客户端传的，否则从池子里随机取
  const clientUA = request.headers.get('User-Agent');
  forwardHeaders.set('User-Agent', clientUA || pickUA());

  forwardHeaders.set('Accept',
    request.headers.get('Accept') ||
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8');
  forwardHeaders.set('Accept-Language',
    request.headers.get('Accept-Language') || 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7');
  forwardHeaders.set('Accept-Encoding', 'gzip, deflate, br');
  forwardHeaders.set('Cache-Control', 'no-cache');
  forwardHeaders.set('DNT', '1');

  // 域名定制头
  const domainHeaders = getDomainHeaders(target.hostname);
  for (const [k, v] of Object.entries(domainHeaders)) {
    forwardHeaders.set(k, v);
  }

  // 透传认证头
  if (request.headers.get('Content-Type')) {
    forwardHeaders.set('Content-Type', request.headers.get('Content-Type'));
  }
  if (request.headers.get('Authorization')) {
    forwardHeaders.set('Authorization', request.headers.get('Authorization'));
  }

  // 转发请求（最多重试 2 次，指数退避）
  let lastError = null;
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000)); // 2s, 4s
      // 每次重试换 UA
      forwardHeaders.set('User-Agent', pickUA());
    }

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

      // 成功或可接受的错误码 → 透传
      if (response.status < 500 || attempt === 2) {
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('X-Proxy-By', 'DevToolsBox');
        responseHeaders.set('X-Proxy-Attempt', String(attempt + 1));
        if (attempt > 0) responseHeaders.set('X-Retry', 'true');
        // 移除可能破坏嵌入的安全头
        responseHeaders.delete('Content-Security-Policy');
        responseHeaders.delete('Content-Security-Policy-Report-Only');
        responseHeaders.delete('X-Frame-Options');
        responseHeaders.delete('Frame-Options');

        // raw 模式返回纯文本
        if (rawMode) {
          const body = await response.text();
          return new Response(body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          });
        }

        // HTML 响应 → 重写 URL
        const contentType = responseHeaders.get('Content-Type') || '';
        if (contentType.includes('text/html')) {
          const html = await response.text();
          const rewritten = rewriteHtml(html, target.hostname, '/api/proxy');
          // Cloudflare Workers 自动处理 Content-Length，不需要手动设置
          responseHeaders.set('X-Proxy-Rewritten', 'true');
          return new Response(rewritten, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          });
        }

        // 非 HTML → 流式透传
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      }
    } catch (e) {
      lastError = e;
    }
  }

  // 所有重试失败
  return new Response(JSON.stringify({
    error: 'Upstream request failed after 3 attempts',
    detail: lastError?.message || 'Unknown error',
    target: targetUrl,
  }), {
    status: 502,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
