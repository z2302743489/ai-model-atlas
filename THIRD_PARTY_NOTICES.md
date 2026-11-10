# 第三方与数据来源声明

## 项目代码

本项目原创页面代码、构建工具和维护文档按根目录 `LICENSE` 中的 MIT 许可证提供。MIT 代码许可不将第三方商标、模型权重、官方原文或第三方数据重新授权为 MIT。

## 品牌名称与图标

品牌名称、产品名称和商标属于各自权利人，只用于识别指南所讨论的对象，不表示任何厂商背书或合作关系。

大部分图标来自 [LobeHub / lobe-icons](https://github.com/lobehub/lobe-icons) 的固定 npm 版本。原 MIT 许可证完整保存在 `licenses/LICENSE-LobeHub.txt`，构建时会复制到 `dist/LICENSE-LobeHub.txt`。包版本、提交、压缩包完整性、逐图标来源和例外详见 `src/data/icons-sources.json`。

部分图标可能来自品牌官方站点的原始 favicon，来源清单会逐项标记。此类图标不因与 LobeHub 图标一同展示而获得 LobeHub MIT 授权。图标库许可证不授予商标使用权。

## 模型与套餐资料

`src/data/models.json` 和 `src/data/pricing.json` 是对厂商公开事实的人工整理，保留各条目的官方来源 URL、核验日期和条件说明。官方文档、商标、模型卡及模型/权重许可证仍属于其权利人，适用相应来源条款。本项目不分发模型权重或厂商长篇原文，不提供转售访问额度。

## Arena

`src/data/arena-rankings.json` 是 [Arena 官方公开排行榜](https://arena.ai/leaderboard) 的有限静态事实摘录，具体页面、更新日和指标见各榜的 `sourceUrl`、`updatedAt`、`metric` 与 `metricDescription`。Arena 品牌及原始数据权利归原权利人；本项目代码 MIT 许可证不改变来源站点的条款。再次分发或扩大使用范围前，应复核 [Arena 官方条款](https://arena.ai/terms-of-use) 与数据页面的当前说明。

## 系统字体与本机偏好

页面使用操作系统提供的系统字体，未打包字体二进制，也不请求 Google Fonts 或其他在线字体服务。深色／浅色外观偏好仅写入当前浏览器的 `localStorage`；未设置偏好时跟随系统外观。页面不配置分析统计服务。URL 哈希保存页面与筛选状态，供刷新和分享链接时恢复界面。

## 首页背景视频与海报

视频作者为 **Pressmaster**，原始素材为 [Digital Projection Of Abstract Geometrical Lines（Pexels 3129671）](https://www.pexels.com/video/digital-projection-of-abstract-geometrical-lines-3129671/)。素材页列出 40 秒、30 fps，页面使用 [Pexels 官方 CDN 的 640×360 MP4](https://videos.pexels.com/video-files/3129671/3129671-sd_640_360_30fps.mp4)，核实大小为 1,475,267 字节。同源海报使用素材原页实际链接的 [Pexels JPEG](https://images.pexels.com/videos/3129671/free-video-3129671.jpg?auto=compress&dpr=1&h=750&w=1260)。来源和链接核对日为 2026-11-07。

视频和海报适用 [Pexels License](https://www.pexels.com/license/) 与 [2026-10-20 更新的完整条款](https://www.pexels.com/terms-of-service/)，**不按本项目 MIT 许可证再授权**。项目只将素材远程嵌入完整网页设计，不在仓库或发布包中附带原始媒体，也不提供独立素材下载。Pexels 允许免费个人与商业创作、修改及网站使用；其完整条款禁止独立媒体文件再分发，且仅滤镜、改色、缩放或裁剪仍属于独立素材。再次使用应保留来源并遵守 Pexels 当前条款，不能据此声称作者为项目背书。

页面在背景可见且浏览器允许时自动静音循环播放。系统减少动态、浏览器省流或其报告的慢速 2G 网络下保留静态海报。背景离屏或标签页转入后台时自动暂停，重新可见且符合播放条件时恢复；加载或自动播放失败时显示静态回退。视频及海报请求访问 Pexels 第三方 CDN，项目不保证该服务的持续可用性。

## 引用与维护

页面的“来源与核验”区域及可下载 JSON 提供逐条追溯信息。引用本项目时请同时保留快照日期与官方源链接。资料会变化，报告错误时请附官方证据；不以本项目快照替代服务商当前条款、价格或许可。
