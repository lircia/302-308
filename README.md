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


```bash
npm run dev
```

表结构文件路径：`database/redirects.sql`。

## 使用 Cloudflare 连接 Git 部署 Worker

```bash
npm run deploy
```

在 Cloudflare Workers 的 Git 部署设置中填写：

- Root directory：仓库根目录
- Build command：`npm run build`
- Deploy command：`npx wrangler deploy`

也可以将 Build command 留空，把 Deploy command 设置为 `npm run deploy`。不要在没有执行 `npm run build` 的情况下直接运行 `npx wrangler deploy`，因为 Astro 的 Worker 入口需要先生成到 `dist/server`。

Cloudflare 部署成功后，在 Worker 的 Variables / Secrets / Bindings 中配置：

- `URL`：例如 `https://kare.dpdns.org/`
- `ADMIN`：管理员密钥 Secret
- `DB`：D1 Database binding

`DB` 的绑定名必须是 `DB`；D1 表结构请手动执行 `database/redirects.sql`。

`compatibility_date` 必须不晚于 Cloudflare 实际部署当天。若部署日志显示当前日期为 `2026-08-24`，配置不能填写 `2026-08-25`，否则 Cloudflare 会拒绝部署。

`kare.dpdns.org` 还必须在同一个 Worker `302-308` 的 Custom Domains 中绑定。若该域名仍绑定在 Cloudflare 默认的 Hello World Worker 上，访问时仍会看到 Hello World；`URL` 变量本身不会自动把域名转移到新 Worker。

## 使用 Cloudflare Pages 连接同一 Git 仓库

Pages 需要在 Cloudflare 中新建一个独立的 Pages 项目，选择同一个 Git 仓库。项目设置如下：

- Root directory：`pages`
- Build command：留空
- Build output directory：`public`

Pages 会自动读取 `pages/public` 的纯静态网页和 `pages/functions` 的 Pages Functions。不要把 Pages 项目的 Root directory 设置为仓库根目录，否则会把 Worker 项目当成 Pages 项目构建。

这样同一个仓库会按目录自动区分：

- Worker 项目：Root directory 为仓库根目录，Build command 为 `npm run build`，Deploy command 为 `npx wrangler deploy`
- Pages 项目：Root directory 为 `pages`，不执行构建命令，输出目录为 `public`

### Pages 的变量和 D1 绑定

在 Pages 项目的 Settings / Variables and Bindings 中配置与 Worker 相同的内容：

- `URL`：管理员域名，例如 `https://kare.dpdns.org/`
- `ADMIN`：管理员密钥 Secret
- `DB`：D1 Database binding，绑定到与 Worker 相同的 D1 数据库

Worker 和 Pages 可以同时绑定同一个 D1 数据库；两边的绑定名称都必须是 `DB`。Pages 的 `URL` 只允许其对应域名显示管理后台，其他绑定域名会按 D1 中的 `redirects` 表执行重定向。

同一个域名不能同时绑定到 Worker 和 Pages。若两者同时上线，请给它们设置不同的管理域名；例如 Worker 使用 `worker-admin.example.com`，Pages 使用 `pages-admin.example.com`，两者仍可绑定同一个 D1。

Pages 的静态管理页面路径为 `pages/public/index.html`，D1 和登录 API 位于 `pages/functions`。虽然页面本身是纯静态文件，但使用 D1 必须启用 Pages Functions；Functions 不会把页面变成 Astro SSR。

表结构仍然只需在 D1 控制台的 SQL 编辑器中手动执行一次：

```text
database/redirects.sql
```

不要在 Pages 项目中执行 `npx wrangler deploy`，也不要在 Worker 项目中使用 Pages 的输出目录。两者使用同一个 Git 仓库和 D1，但分别由 Cloudflare Workers 项目与 Cloudflare Pages 项目部署。
