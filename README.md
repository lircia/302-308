# Domain Redirect Worker

纯后端 Astro 7 + `@astrojs/cloudflare` + Cloudflare Workers 域名重定向项目。映射数据存储在 Cloudflare D1，不使用域名作为代码变量名，也不提供普通前端页面。

## Cloudflare 配置

1. 创建一个 Cloudflare D1 数据库，例如 `domain-redirects`。
2. 在 Cloudflare Workers 的 Settings / Bindings 中添加 D1 Database binding，绑定变量名必须为 `DB`。数据库 ID 不写入仓库的 `wrangler.toml`。
3. 打开 Cloudflare D1 控制台的 SQL 编辑器，将项目中的 `database/redirects.sql` 文件内容粘贴进去并执行一次，用于创建 `redirects` 表。不需要执行 Wrangler 迁移命令。
4. 在 Cloudflare Workers 的 Variables 中配置 `URL`，例如：

```text
URL=https://admin.example.com
```

`URL` 的域名就是管理后台域名，支持填写完整 URL 或纯域名。未配置 `URL` 时，管理后台完全不可访问。

5. 在 Cloudflare Workers 的 Secrets 中配置 `ADMIN`，值为后台密钥。

## 管理后台

访问 `URL` 对应的域名根路径，例如 `https://admin.example.com/`，输入 `ADMIN` 密钥登录。

后台为白色页面，仅提供：

- 添加访问域名和完整的 `http://` 或 `https://` 重定向 URL
- 查看 D1 中的现有映射
- 删除映射

登录后使用 HttpOnly、Secure、SameSite=Strict Cookie，不把管理员密钥放入 URL 或浏览器持久化存储。

## 重定向规则

- 所有访问先读取请求域名，并在 D1 的 `redirects.domain` 中查找。
- `http` 和 `https` 访问同一个域名时使用同一条映射。
- 域名大小写和末尾点会被标准化，访问端口不参与匹配。
- 访问 URL 后面的任意路径和查询参数都会被忽略。
- 命中后始终返回 D1 中保存的完整目标 URL，不拼接、不修改目标 URL。
- 未配置的访问域名返回 `404`。

## 本地运行

本机开发依赖复用已有 Astro、Cloudflare 适配器和 Wrangler，不需要重新安装：

```bash
npm run dev
```

表结构文件路径：`database/redirects.sql`。

## 部署

```bash
npm run deploy
```

如果使用 Cloudflare 控制台的 Git 自动部署：

- Build command：留空，或填写 `npm run build`
- Deploy command：`npm run deploy`

不要只使用 `npx wrangler deploy`，因为 Astro 的 Worker 入口需要先由 `npm run build` 生成。

GitHub Actions 还需要配置以下 Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
