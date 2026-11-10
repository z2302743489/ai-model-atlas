# 模型全景 · AI Model Atlas

一个可搜索、筛选和横向对比的中文 AI 模型指南，包含模型特点、适用场景、Arena 分类榜和套餐额度。页面与数据全部静态生成，无后端、无 API 密钥、无第三方 npm 运行依赖。

页面按用户提供参考的布局方向重新实现，未分发参考 HTML。

初始数据核验日：**2026-11-06**。UI 整理日：**2026-11-08**。当前页面的核验日以 `src/data/models.json` 的 `checkedAt` 为准；这些日期代表项目快照，不代表打开页面时的实时信息。

![页面预览](docs/screenshot.jpg)

[深色外观预览](docs/dark.jpg) · [手机版预览](docs/mobile.jpg)

## 本地运行

安装 Node.js 22 或更新版本（GitHub Actions 使用 Node.js 24），在仓库根目录运行：

~~~sh
npm run dev
~~~

浏览器打开终端显示的地址，默认是 `http://127.0.0.1:4173/`。不需要执行 `npm install`。修改 `src/` 后手动刷新页面，开发服务器会在请求 HTML 时重新构建。

~~~sh
npm run check  # 校验并生成 dist/
npm run build # 单独生成 dist/
~~~

端口和主机地址可通过 `PORT`、`HOST` 环境变量修改；默认只监听本机。可用 `BASE_PATH=/ai-model-guide/ npm run dev` 模拟 GitHub Pages 仓库子路径。静态资源与下载链接均使用相对路径，不需要在构建时填仓库名。

## 使用界面

点击外观按钮切换浅色／深色模式；偏好仅保存在当前浏览器的 `localStorage` 中，未选择时跟随系统外观。`⌘K`（Windows / Linux 为 `Ctrl+K`）聚焦全局搜索。

品牌、型号、榜单、套餐及其筛选条件会写入 URL 哈希路由；刷新页面、复制链接与浏览器前进／后退可以恢复相应视图。路由采用哈希，因此静态托管无需另配服务器重写。界面使用系统字体，不请求 Google Fonts 或其他在线字体服务。

首页背景视频来自 Pressmaster 在 Pexels 发布的 [Digital Projection Of Abstract Geometrical Lines](https://www.pexels.com/video/digital-projection-of-abstract-geometrical-lines-3129671/)，使用官方 CDN 的 640×360 版本，约 1.48 MB。视频与同源海报均为远程引用，仓库和发布包不附带原片；播放需要访问第三方 CDN。素材适用 [Pexels License](https://www.pexels.com/license/) 和[完整条款](https://www.pexels.com/terms-of-service/)，不适用本项目的 MIT 代码许可。

背景在可见且浏览器允许时自动静音循环播放。启用系统“减少动态”、浏览器省流，或浏览器报告慢速 2G 网络时，保留静态海报。离开首页区域或将页面切到后台会自动暂停，重新可见且符合播放条件时恢复；自动播放被阻止、素材加载失败或离线时保留静态回退。省流识别取决于浏览器提供的网络信息。

## 更新数据

直接维护 `src/data/` 中的 JSON，再运行 `npm run check`。不要编辑 `dist/` 或生成的 `dist/assets/data.js`。

| 文件 | 内容 |
| --- | --- |
| `models.json` | 品牌与代表模型、特点、场景、能力边界、许可及来源 |
| `arena-rankings.json` | Arena 分类榜的局部摘录、分数含义、更新时间和来源 |
| `pricing.json` | 应用会员、代码订阅、API 按量及自部署方案 |
| `icons.json` | 已嵌入图标的 data URL 映射 |
| `icons-sources.json` | 固定版本图标包、各图标来源、校验信息与商标说明 |

每次更新都要实际打开官方来源，更新对应条目的 `checkedAt`，保留可直接访问的 `sourceUrls` 或 `sources`。只改已核实字段，未公开报价或额度保留 `null` 并明确说明。年付折算、每人计费、首月促销、地区和税费分别描述；应用会员价格不能写成 API 赠额。Arena 原始型号别名、分榜、排名和指标应按官方页保留，不合并为跨榜总排名。

构建时会将模型、排名和套餐合并到可下载的 `dist/models.json`，同时保留独立下载文件。因此网页和下载数据来自同一组源文件。

更新模型资料后，维护 `models.json.checkedAt` 作为整体模型快照日期；排名与套餐仍保留各自的核验和原榜更新日期，不能以模型总日期覆盖。构建会从数据生成运行时 `CHECKED`、页面快照日期、下载文件名、厂商／型号／榜单／套餐统计和国内／海外导航数量，避免手工维护旧的 `18 / 61 / 11 / 99`。`src/index.html` 的 `{{SNAPSHOT_*}}` 是构建占位符，修改布局时保留这些字段。

## GitHub Pages 发布

本仓库已提供 `.github/workflows/pages.yml`。默认推送和 pull request 只运行检查与构建；需要发布 Pages 时再启用部署开关：

1. 将项目文件提交到 GitHub 仓库的 `main` 分支；若使用其他主分支，修改工作流内的分支名。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在仓库 **Settings → Secrets and variables → Actions → Variables** 新建仓库变量 `DEPLOY_PAGES`，值设为 `true`。
4. 推送到 `main`，或在 Actions 中手动运行工作流。构建校验通过后，工作流上传 `dist/` 并部署到 `github-pages` 环境。
5. 打开工作流给出的页面地址。项目页形如 `https://用户名.github.io/仓库名/`，无需修改本地资源路径。

Pull request 只执行检查和构建，不部署。无需配置个人访问令牌；Pages 部署使用 GitHub 提供的 `GITHUB_TOKEN` 和 OIDC 权限。仓库与环境的访问权限仍由发布者自行管理。

工作流于 2026-11-10 对照 [GitHub Pages 官方自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)、[checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)、[setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0)、[configure-pages v6.0.0](https://github.com/actions/configure-pages/releases/tag/v6.0.0)、[upload-pages-artifact v5.0.0](https://github.com/actions/upload-pages-artifact/releases/tag/v5.0.0) 和 [deploy-pages v5.0.1](https://github.com/actions/deploy-pages/releases/tag/v5.0.1) 核对。后续升级 Actions 版本时请再次检查官方兼容说明。

## 结构

~~~text
src/
  index.html             页面结构
  styles.css             响应式样式
  app.js                 搜索、筛选、对比、榜单与套餐交互
  data/                  可维护的静态 JSON
scripts/
  build.mjs              用 Node 原生模块构建
  check.mjs              语法、JSON、文件、相对路径与路径安全检查
  dev.mjs                本机预览服务器
  snapshot.mjs           快照日期与统计注入
licenses/                第三方图标库许可
.github/workflows/       检查与 Pages 发布
docs/screenshot.jpg     页面预览
dist/                   生成目录，不提交到 Git
~~~

构建只读取 `src/`、图标许可和第三方声明，输出到固定的 `dist/` 目录。浏览器按顺序读取 `assets/data.js` 和 `assets/app.js`，因此没有运行时拉取数据服务。开发服务器只暴露构建目录，校验请求路径与真实文件路径，并提供 HTML、CSS、JavaScript、JSON 和图片 MIME 类型。

## 数据与使用边界

这是人工核对的静态参考资料，覆盖代表型号与套餐，既非全量 SKU，也非采购报价。模型供应、地区、税费、套餐权益、动态限额、促销和官方排名可能变化；实际使用前应打开条目来源复核。未公开、登录后才显示或由销售定价的字段会明确标注，不视为零元或无限额度。没有跨币种汇率换算。

Arena 数据是官方公开分类榜的前若干行摘录；各榜指标、样本和更新日不同。分数、置信区间、名次范围、票数及净改善等概念不能互换，官方未提供的字段保留为空。页面展示不代表第三方背书。

页面只使用操作系统提供的字体，未打包或在线请求第三方字体。外观偏好仅在本机浏览器保存；页面不配置分析统计服务。详见 [第三方与数据来源声明](THIRD_PARTY_NOTICES.md)。

项目代码按 [MIT](LICENSE) 许可。第三方品牌图标、商标、官方资料和 Arena 数据各自适用原权利人与来源条款；代码许可不改变这些权利。贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。
