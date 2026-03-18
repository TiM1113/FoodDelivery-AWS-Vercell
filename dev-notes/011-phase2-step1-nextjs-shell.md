# 011 — Phase 2 Step 1: Next.js 15 App Shell

**Date:** 2026-03-18
**Stage:** Phase 2 Step 1 完成
**Branch:** `phase2/step1-nextjs-shell` → merged to main via PR #13
**Result:** `apps/web` Next.js 15 骨架上线，Vercel `food-delivery-web` 项目部署成功（38s 构建），四个 Vercel 项目均已配置 Ignored Build Step。

---

## Why / 为什么要做这步

Phase 1 完成了安全地基（RBAC、Stripe Webhook、限流、类型安全）。Phase 2 的核心目标是把前端从 React + Vite 迁移到 Next.js 15，获得 SSR/SSG、App Router、更好的 SEO 和 DX。

Step 1 的策略是**只建空壳，不迁移功能**：
- 旧三端（frontend / admin / backend）保持正常运行，用户访问不受影响
- 新建 `apps/web` 作为 Next.js 骨架，平行部署到独立的 Vercel 项目
- 后续 Step 2-4 逐步把功能迁移进去，最后 Phase 2 收尾再退役旧三端

这个策略的好处是「零停机迁移」——任何时候出问题，旧版本仍然在线。

---

## What was done / 做了什么

### monorepo 改动
- `pnpm-workspace.yaml`：新增 `- 'apps/*'`
- 根 `package.json`：新增 `dev:web` / `build:web` / `typecheck:web` 脚本；`engines.node` 从 `>=18.0.0` 升至 `>=20.9.0`（Next.js 16 最低要求）

### apps/web 新建内容
| 文件 | 说明 |
|------|------|
| `package.json` | `@food-delivery/web`，引用 `@food-delivery/shared: workspace:*` |
| `next.config.ts` | `transpilePackages: ["@food-delivery/shared"]`；S3 图片域名 `**.amazonaws.com` + `pathname: "/**"` |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS 集成 |
| `src/app/globals.css` | `@import "tailwindcss"`（v4 单行语法） |
| `src/app/layout.tsx` | RootLayout，含 Navbar + Footer |
| `src/app/page.tsx` | 首页占位（"Phase 2 in progress"） |
| `src/components/navbar.tsx` | Navbar 骨架（无业务逻辑） |
| `src/components/footer.tsx` | Footer 骨架 |
| `src/components/ui/` | shadcn/ui Button / Badge / Separator |
| `src/lib/utils.ts` | shadcn/ui `cn()` 工具函数 |
| `components.json` | shadcn/ui 配置（New York 风格，Zinc 色） |

### CodeRabbit Review 处理（PR #13）
| # | 问题 | 处理 |
|---|------|------|
| 1 | `*.amazonaws.com` 不匹配多级子域 | ✅ 改为 `**.amazonaws.com` + `pathname: "/**"` |
| 2 | `engines.node` 低于 Next.js 16 要求 | ✅ 改为 `>=20.9.0` |
| 3 | `--font-sans: var(--font-sans)` 循环引用 | ✅ 删除该行 |
| 4 | README 路径 `app/page.tsx` 有误 | ✅ 改为 `src/app/page.tsx` |
| 5 | `backend/.gitignore` 的 `.vercel` 位置 | ❌ 不采纳（`backend/.vercel` 是 Phase 1 `vercel link` 产生的，该条目正确且必要） |

### Vercel 配置
- 新建 `food-delivery-web` 项目（Root Directory: `apps/web`，框架自动检测为 Next.js）
- 首次部署：38 秒，状态 Ready
- 线上地址：`https://food-delivery-web-eosin.vercel.app`
- 四个 Vercel 项目均配置 Ignored Build Step（`Run my Bash script` 模式）：

| 项目 | 脚本 |
|------|------|
| backend | `git diff HEAD^ HEAD --quiet -- backend/ packages/shared/` |
| frontend | `git diff HEAD^ HEAD --quiet -- frontend/ packages/shared/` |
| admin | `git diff HEAD^ HEAD --quiet -- admin/ packages/shared/` |
| food-delivery-web | `git diff HEAD^ HEAD --quiet -- apps/web/ packages/shared/` |

---

## What I learned / 复盘总结

1. **Tailwind v4 不需要 `tailwind.config.js`**：一行 `@import "tailwindcss"` 即可，旧的 `@tailwind base/components/utilities` 语法已废弃。

2. **Next.js monorepo 必须加 `transpilePackages`**：Next.js 默认不编译 `node_modules`，`packages/shared` 是 ESM 源码，不加这行会报 import 错误。

3. **S3 图片域名通配符规则**：`*.amazonaws.com` 只匹配单层子域（如 `s3.amazonaws.com`），不匹配 `bucket.s3.us-east-1.amazonaws.com`（三层）。正确写法是 `**.amazonaws.com`（两个星号）。

4. **Vercel Ignored Build Step 使用 `Run my Bash script`**：不是填在 Git 设置里，而是在 `Build and Deployment` → `Ignored Build Step` → 选 `Run my Bash script`。`--quiet` 只是抑制输出，exit code 逻辑不变（0=跳过，1=构建）。

5. **CodeRabbit 会对修复后的 commit 重新触发旧评论**：这是正常行为（"Verification inconclusive"），验证代码实际状态是关键，不要被重复评论干扰判断。

---

## Files changed / 改动的文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `pnpm-workspace.yaml` | 修改 | 新增 `apps/*` |
| `package.json` | 修改 | 新增 web 脚本，engines.node 升级 |
| `apps/web/**` | 新建 | Next.js 15 完整骨架（27 个文件） |
| `backend/.gitignore` | 修改 | 补充末尾换行 |
| `pnpm-lock.yaml` | 自动更新 | Next.js 15 依赖树 |

## PR

PR #13: feat(web): Phase 2 Step 1 — Next.js 15 app shell with Tailwind v4 + shadcn/ui

---

## 大白话理解 / Plain language summary

**现在有什么问题？**
旧前端是用 Vite 搭的「简单网页」，没有服务端渲染，搜索引擎很难收录，加载速度也一般。要升级成 Next.js，但不能直接在旧代码上改——万一改坏了，用户就没法用了。

**这步做了什么？**
就像在旧店旁边盖了一栋新楼。新楼（`apps/web`）已经完工，但里面只有大厅（Navbar + Footer）和一个「装修中」的牌子，没有任何商品。旧店（`frontend`）还在正常营业，顾客完全感知不到。

同时在四家「快递公司」（四个 Vercel 项目）那里登记了一条规则：「如果这次发货只改了别人家的东西，不用来找我」——这样每次更新新楼时，旧三端不会无缘无故重新部署。

**为什么现在做，不能跳过？**
后续每个 Step（认证、首页食品列表、购物车）都要建在这个骨架上。没有骨架，后面的功能没地方放。

| 之前 | 之后 |
|------|------|
| 只有 `frontend/`（Vite） | 新增 `apps/web`（Next.js 15） |
| 旧前端是唯一的 Vercel 项目 | 四个项目并存，互不干扰 |
| 任何 push 触发全部4个项目重新部署 | Ignored Build Step 精准控制，只部署相关项目 |
| Tailwind v3 配置繁琐 | Tailwind v4 一行导入搞定 |
