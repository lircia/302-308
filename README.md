# Domain Redirect Worker

纯后端 Astro 7 + `@astrojs/cloudflare` + Cloudflare Workers 域名重定向项目，不使用数据库，也不提供前端页面。

## 配置域名映射

编辑 `src/config/redirects.ts`：

```ts
export const REDIRECTS: Record<string, string> = {
  'aaa.sa.sia': 'https://destination.example.com',
  'example.net': 'https://www.example.org/base',
};
```

键名是访问域名，不包含协议、端口或路径；目标地址必须是完整的 `http://` 或 `https://` URL。

匹配规则：

- `http://aaa.sa.sia` 和 `https://aaa.sa.sia` 匹配同一条配置。
- 访问域名后的端口不会影响匹配。
- 域名后的任意路径都会被忽略，目标 URL 保持配置中的原样。
- 原请求的查询参数也会被忽略，不会追加到目标 URL。
- 未配置的访问域名返回 `404`。

默认使用 `302` 临时重定向；如需永久重定向，可在 `src/config/redirects.ts` 中改为 `301`。

## 本地运行

本项目复用 S 盘已有的 Astro、Cloudflare 适配器和 Wrangler 依赖，不需要重新安装：

```bash
npm run dev
```

## 部署到 Cloudflare Workers

```bash
npm run deploy
```

首次部署前需要登录 Wrangler，或设置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。部署后，在 Cloudflare Workers 的 Custom Domains 中绑定需要转发的域名，并确保 DNS 记录已代理到 Cloudflare。

## GitHub Actions

仓库已包含 `.github/workflows/deploy.yml`。在 GitHub 仓库的 Actions secrets 中添加：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

推送到 `main` 分支即可自动检查并部署。GitHub 的干净构建环境会按 `package.json` 安装依赖，本机不会再安装依赖。
