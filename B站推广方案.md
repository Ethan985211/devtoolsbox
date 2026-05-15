# DevToolsBox B站推广视频方案

站点: https://devtoolsbox-1rl.pages.dev
GitHub: https://github.com/Ethan985211/devtoolsbox

---

## 一、视频定位

| 维度 | 策略 |
|------|------|
| 时长 | 4-6 分钟（B站最佳完播区间） |
| 类型 | 工具评测 / 效率推荐 |
| 风格 | 快节奏、信息密度高、真诚推荐 |
| 目标观众 | 开发者、设计师、学生、办公族 |
| 发布分区 | 科技-软件应用 或 数码-效率工具 |
| 差异化 | 强调"数据零上传、纯本地处理"的隐私卖点 |

---

## 二、分镜脚本（含台词）

共 6 个段落，每个段落对应一个录屏场景。

### 片头片段（0:00-0:15）

画面: 黑底白色文字逐字浮现，伴随打字机音效
台词:
"你有没有遇到过这种情况——
想压缩一张图，结果网站让你先注册。
想格式化JSON，结果网页弹了三个广告。
你只是想要一个工具，它却想拿走你的全部数据。"

画面: DevToolsBox 首页 Hero 区域全景展示，暗色主题下渐亮
台词:
"今天推荐一个我用了就回不去的在线工具箱，主打两个字——干净。"

---

### 第一段: 首页全景（0:15-0:50）

画面: 从 Hero 区域向下滚动，展示工具网格、信任条、特性卡片
台词:
"DevToolsBox —— 12款开发者日常工具，全部在这里。
没有注册、没有跳转、没有弹窗。
所有处理全在浏览器本地完成，你的文件从不离开你的设备。"

画面: 点击右上角主题切换按钮，展示暗色/浅色双主题切换
台词:
"支持暗色模式，晚上干活不刺眼。而且它是 PWA 应用，
手机浏览器打开直接添加到桌面，离线也能用。"

画面: 打开浏览器 F12 Network 面板，展示页面静态加载，无任何后台请求
台词:
"注意看 Network 面板——纯静态页面，
你上传的图片、PDF，全在本地处理。零上传，零日志。"

---

### 第二段: 图片工具演示（0:50-1:40）

场景 2A — 图片压缩

画面: 打开图片压缩工具，拖入一张大 PNG 文件（3-5MB），展示实时压缩对比
台词:
"图片压缩——拖进来，左边原图右边压缩预览，
滑块调节质量，实时看效果。一张 5MB 的 PNG 压到 500KB，
肉眼几乎看不出区别。毫秒级处理，因为全在浏览器 Canvas 里跑的。"

场景 2B — 格式转换

画面: 打开格式转换，拖入批量图片，PNG→WebP 一键转换
台词:
"格式转换支持 PNG、JPG、WebP、BMP 互转，保留透明通道。
批量拖放，一键下载。"

---

### 第三段: 编码工具演示（1:40-2:20）

场景 3A — JSON 格式化

画面: 贴入一段乱糟糟的压缩 JSON，点击格式化，语法高亮 + 缩进展开
台词:
"JSON 格式化——后端接口返回的一坨 minify JSON，
贴进来一键展开，语法高亮，还能折叠节点、检测错误。
比在线 JSON 工具快 10 倍，因为本地解析，不走网络。"

场景 3B — Base64 + URL 编解码

画面: 快速切换 Base64 和 URL 编解码，展示双向转换
台词:
"Base64 和 URL 编解码也是刚需。中文、Emoji 完美处理，
复制即走。"

---

### 第四段: 二维码生成（2:20-3:00）

画面: 打开二维码工具，输入网址，展示实时生成的二维码
台词:
"这个二维码工具是我最满意的。
它的二维码引擎完全自研——你没听错，
从伽罗瓦域有限域运算、RS 纠错码、
到 ISO 18004 标准的掩码评估，全部从头写了一遍。"

画面: 切换纠错级别 L/M/Q/H，改变颜色和尺寸，展示 SVG 下载
台词:
"支持 L/M/Q/H 四级纠错率，自定义颜色和尺寸。
输出 SVG 矢量格式，放到海报上无损缩放。
最细节的是，暗模块位置严格按 ISO 标准计算，
手机扫码识别率比大部分在线工具都高。"

---

### 第五段: PDF 工具演示（3:00-3:45）

场景 5A — PDF 合并

画面: 拖入 3 个 PDF 文件，拖拽排序，点击合并，下载
台词:
"三个 PDF 工具：合并、拆分、文本提取。
合并——拖入文件，拖拽排序，一键合并下载。
全部在浏览器本地用 PDF-lib 完成，不需要上传到任何服务器。"

场景 5B — PDF 拆分

画面: 打开拆分工具，设置页码范围如 "1-3,5,7-9"，导出每页
台词:
"拆分按页码范围提取，支持单页导出或 ZIP 打包。"

场景 5C — PDF 文本提取

画面: 上传一个文字型 PDF，秒出文本，复制或下载 TXT
台词:
"文本提取——上传 PDF 直接出文字，下载为 TXT 文件。
最关键是——你的合同内容、发票信息，永远不会被传到第三方服务器。"

---

### 第六段: 其他工具速览 + 结尾（3:45-4:45）

画面: 快速切换时间戳、颜色转换、密码生成器三个工具
台词:
"还有时间戳转换，支持秒和毫秒精度，内置实时时钟。
颜色转换，HEX/RGB/HSL 三者实时互转，前端调色神器。
密码生成器，调用浏览器 Web Crypto API，加密级随机数，
不是 Math.random() 那种伪随机。"

画面: 回到首页，展示底部推荐资源和打赏区域
台词:
"这个站点永久免费、无广告，
靠的是阿里云和 VMSSR 的推广链接维持服务器成本。
如果这些工具帮到了你，也欢迎打赏支持。"

画面: 首页 Hero 区域定格，屏幕中央浮现 URL
台词:
"网址在评论区置顶。纯前端、零依赖、无套路。
觉得有用……点个赞不过分吧？收藏一下，下次用到就是赚到。
我是 Ethan，下期见。"

---

## 三、封面设计

### 封面图尺寸
B站推荐 1146×717 像素（16:10），文件 < 5MB

### 封面设计思路
主标题大字：「12款工具 · 0数据上传」
副标题小字：「开发者免费在线工具箱」
视觉元素: 深色背景 + 工具图标阵列 + "零上传"印章标识
色调: 紫色到蓝色渐变（#6366f1 → #3b82f6），与站点主题一致
底部: 网站 URL devtoolsbox-1rl.pages.dev

### AI 生图提示词（封面）

提示词 1 — 简约现代风格（推荐）:
```
A clean dark-themed technology banner with a grid of 12 minimal tool icons (image, document, lock, QR code, clock, palette, link, key, etc.) arranged in a 4x3 grid. Large bold Chinese title "12款免费开发者工具" in white sans-serif font. A prominent red seal/stamp in the corner reading "数据零上传". Background: dark slate gradient with subtle geometric lines. Modern, minimalist, professional. No people. 16:10 aspect ratio, banner design.
```

提示词 2 — 玻璃质感风格:
```
Dark frosted glass UI layout, floating translucent cards with tool icons. Center text "DevToolsBox" in large gradient purple-to-blue font. Subtitle "免费在线开发者工具 · 12款 · 零上传". Deep navy background with soft glowing orbs. Tech aesthetic, clean, premium feel. Banner 16:10.
```

提示词 3 — 中文生图平台版（通义万相 / 文心一格 / 即梦）:
```
深色科技风横幅设计，中间大字标题"12款免费在线工具"，副标题"数据零上传·纯浏览器本地处理"，紫色渐变背景，排列12个小工具图标卡片，右下角红色印章"隐私安全"，简洁现代扁平风格，16:10比例，
```

---

## 四、视频中可用的插画/关键帧

以下是在视频中可插入的静态插画场景（替代纯录屏，增加视觉丰富度）。

### 插画 1: "数据不上传"概念图

用途: 第一段讲到"数据从未离开你的设备"时插入
画面描述: 一台笔记本，文件在屏幕内被处理的循环箭头，屏幕外有一道红色的"禁止"屏障，表示数据不外泄

提示词:
```
A laptop computer on a desk. Inside the screen, a document icon is being processed with a circular arrow animation. A glowing red shield barrier surrounds the laptop, blocking data from going out to the cloud. The background is dark blue with faint server icons behind the red barrier — unreachable. Concept: local processing, data privacy. Flat vector illustration, clean and modern, tech blue and warm orange accents. 16:9.
```

### 插画 2: "12工具全家福"

用途: 第六段速览所有工具时作为背景
画面描述: 12个工具以卡片形式围绕中心排列，每个卡片有对应的小图标

提示词:
```
A circular arrangement of 12 tool cards floating around a glowing center icon. Each card shows a different tool symbol: image compression icon, format conversion arrows, JSON brackets, Base64 lock, QR code square, clock for timestamp, PDF pages, color palette, link chain, key for password, document with text, scissors for split. Dark background, purple-blue gradient lighting, modern app UI aesthetic style. 16:9.
```

### 插画 3: "暗色/浅色双主题"

用途: 主题切换演示后做视觉过渡
画面描述: 同一个工具箱界面，左半暗色右半浅色，中间一道光分割

提示词:
```
A split-screen illustration showing the same developer toolbox interface. Left half: dark mode with deep navy colors and bright accent elements. Right half: light mode with white/cream background and soft purple accents. A clean vertical dividing line in the center with a sun-to-moon gradient. Minimalist, modern UI design, no text. 16:9.
```

### 插画 4: "QR自研引擎"技术图

用途: 二维码段落时展示技术深度
画面描述: 流程图式的技术架构——左侧"输入文本"→ 中间"GF(256)伽罗瓦域运算 → RS纠错编码 → 掩码评估 → 模块布局"→ 右侧"输出二维码"

提示词:
```
A technical flowchart illustration showing the QR code generation pipeline. Left: a text input box icon. Flow arrows through stages: Finite Field GF(256) calculation, Reed-Solomon error correction encoding, mask pattern evaluation, module matrix layout. Right: a completed QR code output. Dark tech background with neon blue and purple connection lines. Technical diagram style, clean geometric shapes. 16:9.
```

---

## 五、制作步骤

### 步骤 1: 准备素材（15分钟）

```
1. 打开 Chromium/Edge 浏览器，清理浏览器缓存和历史记录
2. 准备测试文件:
   - 一张 3-5MB 的 PNG 图片（用于压缩演示）
   - 几张小图（用于格式转换）
   - 一段乱序 JSON 字符串
   - 3 个示例 PDF 文件
   - 一个想生成二维码的网址
3. 关闭所有不需要的标签页、书签栏（F11 全屏录屏更干净）
4. 将浏览器缩放调到 100%
```

### 步骤 2: 录音（15分钟）

```
1. 使用手机录音机或 Audacity 录制旁白
2. 语速: 每分钟 200-220 字（比正常说话稍快，适合B站节奏）
3. 录音环境: 安静房间，离麦克风 15-20cm
4. 分段录制，每段之间留 2 秒静音方便后期对齐
5. 如果某段不满意，重复录那段即可，不需从头开始
```

推荐免费录音软件:
- Audacity（电脑端，开源免费）https://www.audacityteam.org/
- 手机自带录音机（够用）

### 步骤 3: 录屏（20分钟）

```
1. 推荐录屏工具:
   - OBS Studio（免费，Windows/Mac/Linux）https://obsproject.com/
   - macOS 自带 QuickTime Player → 文件 → 新建屏幕录制
   - Windows 自带 Xbox Game Bar（Win+G）

2. OBS 设置建议:
   - 输出分辨率: 1920×1080
   - 帧率: 30fps（非游戏类足够）
   - 格式: MP4
   - 音频: 关闭麦克风（后期单独配音轨）

3. 录屏时:
   - 每个工具展示 30-60 秒
   - 操作流畅自然，不要过快
   - 鼠标移动平稳，不要乱晃
   - 中断可以剪掉，所以不用紧张
```

### 步骤 4: 剪辑（30-60分钟）

```
推荐剪辑软件:
- 剪映专业版（免费，功能强大，中文界面）https://www.capcut.cn/
- Premiere Pro（专业，付费）
- DaVinci Resolve（免费，专业级）https://www.blackmagicdesign.com/products/davinciresolve

剪辑要点:
1. 导入录屏素材 + 录音音频
2. 将音频对齐到对应画面
3. 剪切掉"嗯…啊…"的口误和过长的停顿
4. 转场用简单的硬切或淡入淡出，不要花哨
5. 0:15 片头处加音效（打字机或键盘声）
6. 结尾加 URL 画面停留 5 秒
7. 添加背景音乐（B站创作中心有免版权音乐，或 YouTube Audio Library）
   - BGM 音量调到 -20dB 到 -25dB，不抢话
   - 推荐类型: Lo-fi 或轻电子
8. 导出: 1920×1080, 30fps, H.264, 比特率 8-12Mbps
```

### 步骤 5: 做封面（10分钟）

```
1. 用 Canva（canva.cn）或 Figma 制作封面
2. 画布: 1146×717 像素
3. 使用方案中的 AI 提示词生成底图
4. 叠加文字:
   - 主标题: "12款免费工具"（大号，白色，加粗）
   - 副标题: "数据零上传 | 开发者必备"（稍小）
   - 角落: "纯本地处理" 印章效果
5. 导出 PNG（不超过 5MB）
```

### 步骤 6: 发布到B站

```
1. 登录 B站创作中心: https://member.bilibili.com/
2. 点击"投稿" → "视频投稿"
3. 上传视频和封面
4. 填写信息:

标题:
  「12款免费在线工具」数据零上传，开发者的干净工具箱 | DevToolsBox

或备选标题:
  这12个工具让我告别了在线工具的广告地狱
  一个没有广告、不上传数据的在线工具箱，我用了半年
  开发者必备！12款纯前端在线工具，数据从不离开你的设备

标签:
  在线工具, 开发者工具, 效率工具, 工具箱, PDF工具, 图片压缩,
  二维码生成, JSON格式化, 免费工具, DevToolsBox

分区: 科技 → 软件应用

简介/评论区置顶:
  DevToolsBox — 12款免费在线开发者工具
  所有处理在浏览器本地完成，数据零上传，无注册无广告。

  包含: 图片压缩 / 格式转换 / JSON格式化 / Base64编解码
  二维码生成 / 时间戳转换 / PDF合并 / PDF拆分 / PDF文本提取
  颜色转换 / URL编解码 / 随机密码生成

  在线使用: https://devtoolsbox-1rl.pages.dev
  GitHub: https://github.com/Ethan985211/devtoolsbox

  如果觉得有用，欢迎 Star ⭐ 和分享给朋友们！
```

---

## 六、推广增强策略

### B站内
1. 标题加入"数字"和"痛点词"——数字吸引点击，痛点引起共鸣
2. 投稿后 2 小时内是流量高峰，选在周二到周四的 12:00 或 18:00 发布
3. 加上合集标签「效率工具推荐」，后续可以做系列
4. 在评论区第一个评论补充工具列表和链接
5. 回复前 10 条评论，提升互动率

### 跨平台联动
6. 把同一视频同步到: 抖音、小红书（裁剪为竖版 1-2分钟精华版）
7. 把脚本改写成图文版发到掘金、知乎
8. 视频简介中加上 GitHub 链接，引导 Star

---

## 七、技术要求备忘

| 项目 | 要求 |
|------|------|
| 视频分辨率 | 1920×1080（1080p） |
| 帧率 | 30fps |
| 编码格式 | H.264 |
| 比特率 | 8-12 Mbps |
| 音频 | AAC, 128-192kbps |
| 封面尺寸 | 1146×717 px |
| 封面格式 | PNG 或 JPG, < 5MB |
| BGM 音量 | 比人声低 -20dB 以上 |
| 视频时长 | 4-6 分钟 |

---

## 八、参考案例

以下是B站同类型效率工具推荐视频的参考风格:

1. 搜索「在线工具推荐」看热门视频的标题和封面套路
2. 搜索「开发者工具推荐」看同赛道视频结构
3. 观察视频评论区常出现的问题，在视频或简介中提前回答

---

总结: 这个方案的核心策略是——用"零上传隐私安全"做差异化，用"12款工具速览"做信息密度，用自研二维码引擎做记忆点。全流程从录屏到发布，一个人 + 半天时间即可完成。
