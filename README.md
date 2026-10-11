# 全球热点观察 · V0.9 权威信源纯净版

这是一个可部署到 GitHub Pages 的静态网页项目，已将原始单文件 HTML 拆分为 HTML、CSS 和 JavaScript 三个文件。

## 文件结构

```text
GHO_V09_GitHub/
├── index.html   # 页面结构
├── style.css    # 页面样式
├── app.js       # 抓取、分类、渲染与调度逻辑
└── README.md    # 项目说明与部署步骤
```

## 发布到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `global-hotspot-observer`。
2. 将以上四个文件上传到仓库根目录（不要把它们留在额外的子文件夹内）。
3. 打开仓库 **Settings → Pages**。
4. 在 **Build and deployment** 中选择 **Deploy from a branch**。
5. Branch 选择 `main`，目录选择 `/(root)`，保存。
6. 等待 GitHub Pages 完成部署，再打开页面上显示的站点地址。

也可以先下载 ZIP，解压后把里面的四个文件上传到仓库根目录。

## 本项目运行方式与限制

- 这是纯前端静态项目，不需要构建工具；入口文件为 `index.html`。
- 新闻抓取依赖外部 RSS 源、RSSHub 实例、RSS2JSON、AllOrigins，以及 Google/Bing 新闻定向搜索镜像。第三方服务可能限流、失效或变更接口，导致部分信源无法抓取。
- 浏览器跨域限制及源站 HTTP/HTTPS 配置可能影响抓取成功率。GitHub Pages 本身只托管静态文件，不提供代理或后端服务。
- 页面中的“AI 分类”当前是基于关键词的本地规则分类，不是调用大语言模型进行推理；热度值也是前端计算的估算值。
- 自动刷新与实时追踪使用浏览器定时器，只在页面打开且浏览器允许脚本运行时工作；关闭页面后不会在服务器后台继续抓取。
- 本地缓存使用浏览器 `localStorage`，不同浏览器或设备之间不会自动共享。
- 若要稳定长期运行，建议后续增加自有后端或 GitHub Actions 定时任务，并对来源可用性、数据去重、时间解析、错误重试及内容授权进行管理。

## 本地预览

直接用浏览器打开 `index.html` 即可查看界面。部分新闻抓取功能会受浏览器跨域策略影响；要验证抓取链路，应通过本地静态服务器或部署后的 HTTPS 页面测试。
