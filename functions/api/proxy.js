/**
 * DevToolsBox Reverse Proxy v4
 * Cloudflare Pages Function — 边缘网络中转代理
 * 用法: /api/proxy?url=https://example.com
 *
 * v4 修复：URL 重写正则 JS 转义 bug + 移除 base 标签（query-string 代理不兼容）
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
// 把 HTML 里的所有资源/跳转链接改写为走代理，
// 确保 CSS/JS/图片/链接/表单在国内都能加载。
//
// 注意：不用 <base> 标签！因为 query-string 代理的 base URL
// 无法让浏览器正确解析根相对路径（/path 会被解析到站点根而非代理）。
// 所有 URL（绝对、协议相对、根相对）都在正则阶段直接重写。

// 注入导航拦截脚本：拦截表单提交和链接点击
function injectNavInterceptor(html, targetOrigin, proxyPrefix) {
  const script = `
<script data-proxy-intercept>
(function() {
  if (window.__proxyInterceptInstalled) return;
  window.__proxyInterceptInstalled = true;
  var PROXY = '${proxyPrefix}';
  var TARGET = '${targetOrigin}';
  function proxyUrl(u) {
    try {
      var abs = new URL(u, location.href);
      // 同源的不代理（已经在本站内）
      if (abs.origin === location.origin) return u;
      return PROXY + encodeURIComponent(abs.href);
    } catch(e) { return u; }
  }
  // 策略 A：拦截所有 form submit（捕获阶段，比页面自身 JS 更早触发）
  document.addEventListener('submit', function(e) {
    var f = e.target;
    if (!f || !f.tagName) return;
    var action = f.getAttribute('action') || '';
    if (action.startsWith('javascript:') || action.startsWith('mailto:') || action.startsWith('tel:')) return;
    var abs;
    try { abs = new URL(action || '', location.href); } catch(ex) { return; }
    if (abs.origin === location.origin) return;
    // 表单指向外部 → 拦截
    e.preventDefault();
    e.stopPropagation();
    var fd = new FormData(f);
    var sp = new URLSearchParams(fd).toString();
    var target = abs.origin + abs.pathname;
    if (sp) target += '?' + sp;
    if (abs.hash) target += abs.hash;
    location.href = PROXY + encodeURIComponent(target);
  }, true);
  // 策略 B：拦截所有链接点击（兜底动态添加的链接）
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a || !a.href) return;
    var href = a.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.includes('/api/proxy')) return; // 已经被重写过
    try {
      var abs = new URL(href, location.href);
      if (abs.origin !== location.origin) {
        a.href = PROXY + encodeURIComponent(abs.href);
        a.target = '_self';
      }
    } catch(ignore) {}
  }, true);
})();
${'<'+'/script>'}`;

  // 注入到 <head> 末尾或 <body> 开头，确保尽早执行
  if (html.includes('</head>')) {
    html = html.replace('</head>', script + '</head>');
  } else if (html.includes('<body')) {
    html = html.replace(/(<body[^>]*>)/i, '$1' + script);
  } else {
    html = script + html;
  }
  return html;
}

function rewriteHtml(html, targetHost, proxyPath, targetUrl) {
  const targetOrigin = 'https://' + targetHost;
  const proxyPrefix = proxyPath + '?url=';

  // ── 策略 1：正则重写 HTML 属性中的 URL ──
  html = rewriteAttrUrls(html, targetOrigin, proxyPrefix, targetUrl);

  // ── 策略 2：重写内联 CSS url() ──
  html = rewriteCssUrls(html, targetOrigin, proxyPrefix, targetUrl);

  // ── 策略 3：重写 meta refresh ──
  html = rewriteMetaRefresh(html, targetOrigin, proxyPrefix, targetUrl);

  // ── 策略 4：注入导航拦截脚本 ──
  // GET 表单提交时浏览器会丢弃代理 URL 的 ?url=... 参数，
  // 必须用 JS 拦截表单提交和链接点击，确保导航始终走代理。
  html = injectNavInterceptor(html, targetOrigin, proxyPrefix);

  return html;
}

// 所有可能包含 URL 的 HTML 属性
// 注意：srcset 在循环内外都有单独处理
const REWRITE_ATTRS = [
  'src', 'href', 'action', 'poster', 'formaction',
  'data-src', 'data-href', 'data-url', 'data-uri',
  'cite', 'content',
];

function rewriteAttrUrls(html, targetOrigin, proxyPrefix, targetUrl) {
  const attrNames = REWRITE_ATTRS.join('|');

  // 【关键修复 v4】使用模板字符串（反引号），防止 JS 字符串转义干扰正则！
  // v3 中普通字符串 '\\s' 被 JS 吞成 's'，'\\2' 被吞成 STX，导致正则完全失效。
  const attrRegex = new RegExp(
    `(${attrNames})\\s*=\\s*(["'])([^"']*?)\\2`,
    'gi'
  );

  return html.replace(attrRegex, (match, attr, quote, value) => {
    const rewritten = rewriteAttrValue(attr, value, targetOrigin, proxyPrefix, targetUrl);
    // 只有真的被改写了才替换，避免无意义操作
    if (rewritten === value) return match;
    return attr + '=' + quote + rewritten + quote;
  });
}

function rewriteAttrValue(attr, value, targetOrigin, proxyPrefix, targetUrl) {
  const attrLower = attr.toLowerCase();

  // srcset 特殊格式：url descriptor, url descriptor
  if (attrLower === 'srcset') {
    return rewriteSrcset(value, proxyPrefix);
  }

  // meta content 可能包含 refresh URL
  if (attrLower === 'content') {
    return rewriteMetaContent(value, targetOrigin, proxyPrefix);
  }

  // data-src / data-href / data-url 可能包含多个逗号分隔的 URL
  if (attrLower.startsWith('data-')) {
    return value.split(',').map(v => rewriteSingleUrl(v.trim(), targetOrigin, proxyPrefix, targetUrl)).join(', ');
  }

  // 跳过 href="#..." 锚点
  if (attrLower === 'href' && value.startsWith('#')) {
    return value;
  }

  return rewriteSingleUrl(value, targetOrigin, proxyPrefix, targetUrl);
}

function rewriteSingleUrl(url, targetOrigin, proxyPrefix, targetUrl) {
  // 只跳过空字符串；"/" 等单字符合法路径必须重写（否则表单 action="/" 不会被代理）
  if (!url) return url;

  // 跳过非 HTTP 协议和特殊值
  if (
    url.startsWith('#') ||
    url.startsWith('javascript:') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('{{') ||         // 模板语法
    url.startsWith('{%') ||         // Jinja/模板
    url.startsWith('${')            // JS 模板
  ) {
    return url;
  }

  // 已经是代理 URL，不重复包裹
  if (url.includes('/api/proxy?url=')) {
    return url;
  }

  let fullUrl;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    fullUrl = url;
  } else if (url.startsWith('//')) {
    fullUrl = 'https:' + url;
  } else if (url.startsWith('/')) {
    // 根相对路径 → 拼成完整 URL 再包裹代理前缀
    fullUrl = targetOrigin + url;
  } else {
    // 纯相对路径（如 styles/main.css 或 ../images/logo.png）
    // 用目标页面 URL 作为基准来解析
    try {
      fullUrl = new URL(url, targetUrl).toString();
    } catch {
      fullUrl = targetOrigin + '/' + url;
    }
  }

  return proxyPrefix + encodeURIComponent(fullUrl);
}

function rewriteSrcset(value, proxyPrefix) {
  return value.split(',').map(part => {
    const trimmed = part.trim();
    const m = trimmed.match(/^(\S+)(\s+.+)?$/);
    if (!m) return trimmed;
    let url = m[1];
    const desc = m[2] || '';
    if (url.startsWith('//')) url = 'https:' + url;
    if ((url.startsWith('http://') || url.startsWith('https://')) && !url.includes('/api/proxy')) {
      return proxyPrefix + encodeURIComponent(url) + desc;
    }
    return trimmed;
  }).join(', ');
}

// meta http-equiv="refresh" content="0;url=https://..."
function rewriteMetaContent(value, targetOrigin, proxyPrefix, targetUrl) {
  // 匹配 content="0;url=..." 这种格式
  const m = value.match(/^(\d+;\s*url\s*=\s*)(.+)$/i);
  if (m) {
    const rewritten = rewriteSingleUrl(m[2].trim(), targetOrigin, proxyPrefix, targetUrl);
    return m[1] + rewritten;
  }
  return value;
}

function rewriteMetaRefresh(html, targetOrigin, proxyPrefix, targetUrl) {
  // 有些页面用 <meta content="0; url=..." http-equiv="refresh">
  // 上面的 attr 正则已经通过 content 属性处理了，这里做兜底
  return html.replace(
    /(<meta\s[^>]*http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'])(\d+;\s*url\s*=\s*)([^"']+)(["'][^>]*>)/gi,
    (match, prefix, mid, url, suffix) => {
      const rewritten = rewriteSingleUrl(url.trim(), targetOrigin, proxyPrefix, targetUrl);
      return prefix + mid + rewritten + suffix;
    }
  );
}

// 重写内联 <style> 和 style="..." 属性中的 url()
// 匹配 url("...") url('...') url(...)
function rewriteCssUrls(html, targetOrigin, proxyPrefix, targetUrl) {
  // 处理 <style> 块和 style="..." 属性中的 url()
  return html.replace(
    /url\(\s*(["']?)([^"')]+)\1\s*\)/gi,
    (match, quote, url) => {
      const rewritten = rewriteSingleUrl(url.trim(), targetOrigin, proxyPrefix, targetUrl);
      if (rewritten === url.trim()) return match;
      return 'url(' + (quote || '') + rewritten + (quote || '') + ')';
    }
  );
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
      service: 'DevToolsBox Reverse Proxy v4',
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
          const rewritten = rewriteHtml(html, target.hostname, '/api/proxy', target.toString());
          responseHeaders.set('X-Proxy-Rewritten', 'true');
          responseHeaders.set('X-Proxy-Version', 'v5');
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
