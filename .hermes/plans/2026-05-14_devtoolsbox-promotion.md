# DevToolsBox 推广方案

## 现状诊断

**SEO 缺失项：**
- 无 Open Graph / Twitter Card 标签 → 分享到微信/QQ/Twitter 无预览图
- 首页 description 仍写 "6大"（实际 12 工具）
- 无 JSON-LD 结构化数据 → Google 无富摘要
- 无 canonical URL
- 宣称"PWA 可安装"但无 manifest.json

**已具备：**
- sitemap.xml（13个URL）
- robots.txt（开放全部）
- 每页有 meta description

---

## 执行步骤

### 第1步：SEO 基础修复
- 首页 description 改 "6大" → "12款"
- 全站加 OG/Twitter Card 标签（用纯文本 logo 做 og:image）
- 首页加 JSON-LD WebApplication schema
- 所有页面加 canonical URL

### 第2步：PWA 支持
- 创建 manifest.json
- 所有页面加 `<link rel="manifest">`
- 创建基础 service worker（离线缓存）

### 第3步：工具目录提交
- 提交到常用免费工具导航站
- V2EX 分享帖
- 掘金文章（"12个纯浏览器在线工具，零上传"）

### 第4步：社交推广
- 准备推广文案（中文，适配国内平台）
- 如果 xurl 可用发 X/Twitter

### 第5步：内容页优化
- 密码生成器 description 太短，优化
- 首页 stats 更新为更吸引人的数据

---

## 预期效果
- 搜索"在线二维码生成""免费PDF合并"等长尾词排名提升
- 社交分享有预览图
- Google 搜索结果出现富摘要
- 可添加到手机主屏幕（PWA）
