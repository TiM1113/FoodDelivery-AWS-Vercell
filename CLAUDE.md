# FoodDelivery-AWS-Vercell — Claude Code 项目上下文

> 此文件在每次 Claude Code 对话启动时自动加载。包含完整的项目状态、升级计划和操作规范。

---

## 项目基本信息

- **仓库**：https://github.com/TiM1113/FoodDelivery-AWS-Vercell.git
- **本地路径**：`/Users/timyuan/Desktop/2025-2026-Career/2026-Antigravity-GitHub-Clones/FoodDelivery-AWS-Vercell`
- **部署平台**：Vercel（Serverless）
- **当前分支**：main（125 个 commits）
- **当前版本**：v0.1.0（Phase 1 完成）→ Phase 2 Step 1 完成（2026-03-18）
- **项目性质**：食品外卖平台，四端架构（旧三端 + apps/web）

---

## 当前技术栈（旧版）

| 层级 | 技术 | 版本 |
|------|------|------|
| Frontend | React + Vite + Context API | React 18.3, Vite 5.4 |
| Admin | React + Vite（独立项目） | React 18.3, Vite 6.0 |
| Backend | Express.js + MongoDB | Express 4.x, Mongoose 8.x |
| 认证 | JWT + localStorage | jsonwebtoken 9.x |
| 支付 | Stripe（URL 回调验证） | Stripe 17.x |
| 图片存储 | AWS S3 + Multer | AWS SDK v3 |
| 样式 | 纯 CSS3（组件级） | — |
| 类型安全 | 无（JavaScript） | — |
| 测试 | 无 | — |

---

## 项目结构

```
FoodDelivery-AWS-Vercell/
├── apps/
│   └── web/           🆕 Next.js 15（Phase 2，骨架已上线）
│       ├── src/app/   App Router（layout + page）
│       ├── src/components/  Navbar / Footer / shadcn/ui
│       └── next.config.ts
├── frontend/          用户端（React + Vite，Phase 2 退役前保留）
│   ├── src/context/StoreContext.jsx    核心状态管理（JWT 存 localStorage）
│   └── src/pages/MyOrders/MyOrders.jsx 701行大组件，需拆分
├── backend/           服务器（Express + MongoDB）
│   ├── server.js                       Express 入口
│   ├── controllers/orderController.js  405行，含支付逻辑
│   ├── controllers/foodController.js   279行，含 S3 上传
│   ├── middleware/auth.js              JWT 验证中间件
│   ├── models/                         User / Food / Order
│   └── api/index.js                   Vercel Serverless 适配器
├── admin/             管理后台（React + Vite，Phase 2 退役前保留）
├── packages/shared/   Zod Schemas + TypeScript 类型
└── CLAUDE.md          本文件
```

---

## 已确认的严重问题（必须在 Phase 1 修复）

### 🔴 安全漏洞

1. **Admin 零鉴权**：`GET /api/order/list` 和 `POST /api/order/update` 无任何认证，任何人可访问
2. **Admin 面板无登录保护**：直接访问 URL 即可进入后台
3. **Stripe 验证漏洞**：用 URL 参数 `?success=true` 判断支付成功，可被手动篡改
4. **JWT 存 localStorage**：易受 XSS 攻击，应改为 httpOnly Cookie
5. **`.env` 曾被提交到 GitHub**：所有密钥需立刻重新生成

### 🟠 代码 Bug

6. **Admin Add.jsx 第39行**：`TransformStream.error()` → 应为 `toast.error()`，添加食品功能会崩溃

---

## 升级目标技术栈（新版）

```
语言          TypeScript 5.x（全栈）
框架          Next.js 15（前端 + API Routes）
状态          TanStack Query v5 + Zustand 5
样式          Tailwind CSS v4 + shadcn/ui
表单          React Hook Form + Zod
认证          NextAuth.js v5（httpOnly Cookie + RBAC）
数据库        MongoDB Atlas + Drizzle ORM
缓存/限流     Upstash Redis
支付          Stripe（Webhook 验证）
图片          AWS S3（预签名直传）+ Next.js Image
测试          Vitest + Playwright
监控          Sentry + Vercel Analytics
CI/CD         GitHub Actions + Vercel
包管理        pnpm Workspace（Monorepo）
API 契约      Zod Schema 共享（前后端类型一致）
```

---

## 完整升级路线图（4个 Phase）

### 总览

| Phase | 名称 | 目标 | 版本标记 |
|-------|------|------|---------|
| **Phase 1** | 地基重建 | 消除安全漏洞，建立 Monorepo 工程结构 | v0.1.0 |
| **Phase 2** | 现代化升级 | 迁移 Next.js，大幅提升性能和开发体验 | v0.2.0 |
| **Phase 3** | 工程质量 | 建立测试体系和可观测性 | v0.3.0 |
| **Phase 4** | 产品功能补全 | 填补功能缺口，达到商业发布标准 | v1.0.0 |

---

### Phase 2 计划：现代化升级

**目标**：前端迁移 Next.js 15，后端迁移 Hono，大幅提升性能和 DX

**前端改造**
- 迁移至 **Next.js 15 App Router**
- 食品列表页：SSG + ISR（静态生成 + 增量再生）
- 订单页：SSR（服务端渲染）
- 引入 **TanStack Query v5**：替代手动 axios，实现数据缓存与乐观更新
- 样式迁移至 **Tailwind CSS v4 + shadcn/ui** 组件库
- 图片改用 **Next.js Image**（自动 WebP、懒加载、CDN）
- 认证改用 **NextAuth.js v5**

**后端改造**
- Express → **Hono**（Edge-first，TypeScript 原生，更轻量）
- 部署至 **Vercel Edge Runtime**
- Mongoose → **Drizzle ORM**（TypeScript 原生，建立索引策略）
- 图片上传改为 **S3 预签名 URL 直传**（绕过服务器，减少带宽）

**Admin 改造**
- 合并入主项目 `/admin` 路由组（受 RBAC 保护，不再是独立项目）
- 表格改用 **TanStack Table v8**（虚拟滚动、排序、过滤、分页）
- 表单改用 **React Hook Form + Zod**

---

### Phase 3 计划：工程质量

**目标**：建立完整质量保障和可观测性体系

- **Vitest**：核心业务逻辑单元测试（支付、订单、认证流程）
- **Playwright**：关键用户旅程 E2E 测试（注册→点餐→支付→查看订单）
- **Sentry**：前后端全链路错误追踪
- **Vercel Analytics + Speed Insights**：监控 Core Web Vitals
- **GitHub Actions CI**：PR 触发 lint + test + build 全自动流水线
- **Dependabot**：自动依赖安全更新

---

### Phase 4 计划：产品功能补全

**目标**：填补现有功能缺口，达到商业发布标准

- **优惠码系统**：后端存储、前端校验、Stripe discount 集成（当前 UI 已有入口但未实现）
- **订单实时状态推送**：Vercel KV + SSE 或 WebSocket
- **用户个人中心**：编辑资料、收货地址管理
- **食品搜索 & 分类过滤**：MongoDB Atlas Search 全文搜索
- **分页加载**：Cursor-based pagination（适配 Serverless）
- **订单取消 + 退款**：已支付订单的 Stripe 退款流程
- **Admin 数据看板**：销售额趋势、热销品类、订单转化率（Recharts）
- **法律合规**：Privacy Policy、Terms of Service 页面（澳洲隐私法要求）
- **Stripe KYC 验证**：完成商家身份核实，解锁真实收款

---

## Phase 1 计划（当前阶段）：地基重建

**目标**：消除所有严重安全漏洞，建立 Monorepo 工程结构

### 执行顺序

```
Step 1: Monorepo 结构搭建（pnpm workspace）
    ↓
Step 2: TypeScript + Zod Schema 定义
    ↓
Step 3: RBAC 鉴权系统（依赖 TS 类型）
    ↓（可与 Step 3 并行）
Step 4: Stripe Webhook 修复
    ↓
Step 5: 全面输入校验（使用 Step 2 的 Schema）
    ↓
Step 6: API 限流（Upstash Redis）
    ↓（贯穿所有 Step）
Step 7: 环境变量规范化
```

### 各 Step 详情

**Step 1：Monorepo**
- 迁移至 pnpm Workspace，统一管理 frontend / backend / admin / shared 四个包
- 新增 `packages/shared`：放公共类型定义和工具函数
- 统一所有子项目的依赖版本

**Step 2：TypeScript**
- 全栈引入 TypeScript
- 在 shared 包用 Zod 定义 UserSchema / FoodSchema / OrderSchema / CartSchema
- .js → .ts，.jsx → .tsx

**Step 3：RBAC**
- User 模型新增 role 字段（默认 "user"）
- 新增 authMiddleware（验证 JWT Cookie）
- 新增 adminMiddleware（验证 role = "admin"）
- 保护接口：/api/order/list, /api/order/update, /api/food/add, /api/food/remove, /api/food/update
- JWT 迁移至 httpOnly Cookie（Secure + SameSite:Strict）
- Admin 面板增加登录页面

**Step 4：Stripe Webhook**
- 在 Stripe 控制台注册 Webhook Endpoint
- 新建 `POST /api/payment/webhook` 接口
- 使用 stripe.webhooks.constructEvent() 验证签名
- 原 /api/order/verify 只做重定向，不再修改订单状态
- 前端 Verify 页面改为轮询订单状态

**Step 5：输入校验**
- 所有 API 接口加 Zod 校验中间件
- 统一错误响应格式：{ success: boolean, message: string, errors?: [...] }
- 下单时验证 food ID 在数据库中真实存在

**Step 6：限流**
- Upstash Redis 实例（免费套餐）
- 登录：每 IP 每分钟 5 次
- 注册：每 IP 每小时 3 次
- 下单：每用户每分钟 3 次
- 超限返回 429 + Retry-After 响应头

**Step 7：环境变量**
- 清查所有硬编码 URL 和配置值
- 创建规范 .env.example
- 后端启动时校验必需环境变量，缺失则拒绝启动

---

## Git 工作流规范

### 分支策略（GitHub Flow）

```
main 永远是稳定的、可部署的
所有开发在 feature branch 上进行
通过 Pull Request 合并回 main
```

### 分支命名

```
phase1/step1-monorepo
phase1/step2-typescript
phase1/step3-rbac
phase1/step4-stripe-webhook
phase1/step5-validation
phase1/step6-rate-limit
fix/描述bug的名字
```

### Commit Message 格式（Conventional Commits）

```
feat(auth): add RBAC middleware
fix(admin): replace TransformStream with toast.error
security(routes): protect admin-only endpoints
chore: setup pnpm workspace monorepo
refactor(backend): migrate controllers to TypeScript
```

### 合并方式

使用 **Squash and merge**（将功能分支所有 commit 合并为 1 条整洁记录）

### 版本标记

```
Phase 1 完成 → git tag v0.1.0
Phase 2 完成 → git tag v0.2.0
正式发布 → git tag v1.0.0
```

---

## 完整开发循环（每个 Step 重复执行）

```
① git checkout main && git pull
② git checkout -b phase1/stepN-name
③ 写代码
③.5 安装新 npm 包时：在 monorepo 根目录或对应子包目录下执行 `pnpm add <pkg>`（绝不用 npm install）
④ pnpm test（本地自动化测试，全绿才继续）
⑤ Playwright MCP 手动验证（浏览器截图 + Console 读取）
⑥ 按逻辑分批 git commit（Conventional Commits 格式）
⑥.5 push 前：`git status` 检查，确认无 `package-lock.json`、无 `.env`、无 `node_modules`
⑦ git push → GitHub 创建 Pull Request
⑧ CI 自动跑（TypeScript 编译 + ESLint + Tests + Build）
⑨ Snyk 安全扫描（自动）
⑩ CodeRabbit AI Review（自动，5分钟内出结果）
⑪ 处理评论：🔴 Must Fix 必须改，⚠️ Suggestion 自己判断
⑫ 自己 Review 自己的 PR（Files Changed 标签逐文件读）
⑬ 所有检查通过 → Squash and Merge
⑭ Vercel 自动部署 → 浏览器验证上线效果
⑮ git checkout main && git pull && git branch -d phase1/stepN-name
⑯ 写 dev-notes 文档（见下方 dev-notes 规范）
```

---

## dev-notes 规范

每个 Step 或 Fix 合并后必须写一份 dev-notes 文档，存入 `dev-notes/` 目录。

### 文件命名

```
NNN-[phase]-[step/fix]-[slug].md
示例：
  001-phase1-step1-monorepo.md
  002-phase1-pre-step2-browser-testing.md
  004-fix-shared-build-postinstall.md
```

编号连续递增，不跳号，不重复。

### 文档结构（必须包含以下所有章节）

```markdown
# NNN — [标题]

**Date:** YYYY-MM-DD
**Stage:** 阶段描述（例：Phase 1 Step 2 完成）
**Branch:** `branch-name` → merged to `main` via PR #N
**Result:** 一句话总结结果

---

## Why / 为什么要做这步
（说明动机、前置条件、和其他 Step 的依赖关系）

## What was done / 做了什么
（技术细节：改了哪些文件，核心逻辑是什么）

## Root cause / 根本原因（Fix 类文档专用）
（Bug 是什么、怎么被触发、为什么之前没发现）

## What I learned / 复盘总结
（可复用的经验，不只是"这个 Bug 的解法"）

## Files changed / 改动的文件
（表格列出文件和改动内容）

## PR
（PR 链接）

---

## 大白话理解 / Plain language summary
（必须包含，风格见 Rule 8）
```

### 大白话理解风格（Rule 8）

- 先用生活类比说明「现在有什么问题」（一句话能懂，禁止术语堆砌）
- 再说「这步做了什么」（类比解释，零基础读者能理解）
- 再说「为什么现在做，不能跳过」（说清楚和前后步骤的逻辑依赖关系）
- 最后用对比表格收尾（两列：之前 vs 之后，或：概念 vs 类比）

---

## 测试规范（Code Test）

### 三种测试类型

| 类型 | 工具 | 作用 | 执行时机 |
|------|------|------|---------|
| Unit Test（单元测试） | Vitest | 测试单个函数逻辑（如计算总价、校验格式） | 本地开发时 + CI |
| Integration Test（集成测试） | Vitest + Supertest | 测试 API 接口完整流程（登录→下单→验证数据库） | CI |
| E2E Test（端到端测试） | Playwright | 模拟真实用户操作完整旅程 | CI（Phase 3 引入） |

### 测试命令

```bash
pnpm test              # 跑所有测试
pnpm test:watch        # 监听模式（开发时用）
pnpm test:coverage     # 生成覆盖率报告
```

### Phase 1 测试重点

每个 Step 完成后必须有对应测试覆盖：
- Step 3 RBAC：测试未授权/普通用户/Admin 三种访问结果
- Step 4 Stripe：测试签名验证通过和失败两种情况
- Step 5 校验：测试每个接口的合法/非法输入

### 测试通过标准

CI 中以下全部绿色才允许合并：
```
✅ TypeScript 编译无错误
✅ ESLint 无报错
✅ 所有 Unit + Integration Tests 通过
✅ Build 成功
```

---

## Code Review 规范

### 两种 Review 的分工

| 类型 | 执行者 | 发现什么 |
|------|--------|---------|
| AI Review（自动） | CodeRabbit + Snyk | 代码逻辑、安全漏洞、风格问题、遗漏处理 |
| Self Review（手动） | 自己 | 业务正确性、设计合理性、是否符合项目规范 |

### CodeRabbit 评论处理规则

```
🔴 Must Fix   → 必须修改后才能合并
⚠️ Suggestion → 阅读理解，自己决定是否采纳，可回复说明原因
✅ Looks Good → 无需操作
```

### Self Review 检查清单

每次合并前在 GitHub PR 的 Files Changed 标签里逐文件检查：

```
□ 逻辑是否和 CLAUDE.md 中本 Step 的目标一致？
□ 有没有遗漏的边界情况（空值、超时、并发）？
□ 有没有硬编码的 URL、密钥、配置值？
□ 有没有混入无关改动？
□ console.log 调试代码是否已清除？
□ 每个 commit message 是否准确描述了改动？
□ .env.example 是否同步更新了新增的环境变量？
```

### Snyk 阻断规则

```
Critical 级别漏洞  → 必须修复才能合并（硬性阻断）
High 级别漏洞     → 必须修复才能合并（硬性阻断）
Medium 级别漏洞   → 记录 Issue，下个 Step 处理
Low 级别漏洞      → 记录，不阻断
```

---

## GitHub 仓库配置

### Branch Protection Rules（main 分支）

在 GitHub → Settings → Branches → Add rule 中配置：

```
✅ Require a pull request before merging
✅ Require status checks to pass before merging:
     - CI / typecheck
     - CI / lint
     - CI / test
     - CI / build
     - Snyk Security Check
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
```

### GitHub Actions CI 配置（Phase 1 最小配置）

触发条件：每次 push 到功能分支 + 每次 PR 更新

Jobs 执行顺序：
```
typecheck → lint → test → build
（任一失败则终止，不继续后续 Job）
```

### PR 描述模板

每次创建 PR 填写：
```
## 做了什么
- 列出主要改动

## 为什么这么做
- 说明动机（关联 Phase 和 Step）

## 测试清单
- [ ] 手动测试了哪些场景
- [ ] 本地 pnpm test 全部通过

## 注意事项
- 有没有需要特别关注的改动
```

---

## AI Review 工具配置

| 工具 | 状态 | 作用 |
|------|------|------|
| **CodeRabbit** | 需配置 GitHub 集成 | 每个 PR 自动 Review |
| **Snyk** | 需配置 GitHub 集成 | 安全漏洞扫描 |
| **Playwright CLI Skills** | ✅ 已安装（.claude/skills/playwright-cli）| 浏览器自动化，**当前对话直接可用** |
| **Playwright MCP** | ✅ 已配置（~/.claude.json）| 备用浏览器方案（需新对话加载） |
| **Claude Code** | ✅ 当前使用 | 架构决策 + 代码实现 |

### Playwright MCP 配置（已在 ~/.claude.json）

```json
"playwright": {
  "command": "npx",
  "args": ["@playwright/mcp@latest", "--browser", "chromium", "--channel", "chrome-beta"],
  "env": { "PLAYWRIGHT_HEADLESS": "false" }
}
```

---

## 开始 Phase 1 前的紧急行动清单

```
□ 1. 重新生成所有密钥（MongoDB / JWT / AWS / Stripe）
     原因：.env 曾被提交到 GitHub（commit: f3438eb "Deleted .env"）
□ 2. GitHub 仓库设置 Branch Protection Rules 保护 main
□ 3. 配置 CodeRabbit（github.com/apps/coderabbit）
□ 4. 配置 Snyk（app.snyk.io，GitHub 集成）
□ 5. 安装 pnpm（brew install pnpm）
□ 6. 确认 Node.js 版本 >= 18
```

---

## 用户背景和工作方式

- IT 新手，正在通过这个项目学习工程实践
- 使用 Antigravity（Claude Code VSCode 扩展）
- 目标：理解每个步骤的原理，不只是完成任务
- 工作节奏：每个 Step 先给方案，授权后执行
- 每次实施前需要解释"为什么这么做"

---

## 重要约定

1. 实施每个 Step 前，先说明将要做什么，等用户确认
2. 每个 Step 完成后，用 Playwright MCP 验证效果
3. 使用 Playwright MCP 读取 Console 报错，不需要用户手动截图
4. Commit message 严格遵守 Conventional Commits 格式
5. 所有密钥放环境变量，绝不写入代码
6. **任何提交到仓库的内容（commit message、代码、注释、文件）不得出现 Claude 相关的任何信息**，包括但不限于：Co-Authored-By Claude、generated by Claude、claude.ai 等字样
7. **所有提交到仓库的文件和代码必须使用英文**，不允许出现中文
8. **每个 Step 或 Fix 合并后必须写 dev-notes**，完整规范见「dev-notes 规范」章节（包含文件命名、文档结构、大白话理解风格要求）
9. **与用户对话必须始终使用简体中文**，无论代码、文件、或上下文里出现任何其他语言（英文、日文等），回复语言不受影响，永远是中文
10. **pnpm monorepo 中安装新包必须用 `pnpm add <pkg>` 或 `pnpm add -D <pkg>`，绝不使用 `npm install`**；npm install 会生成 package-lock.json 并跳过 pnpm-lock.yaml，导致 Vercel 误判包管理器切换为 npm，进而部署失败（来源：Step 5 事故，dev-notes 007）
11. **push 前检查 `git status`，确认没有 `package-lock.json` 被 stage**；若发现应立刻 `git rm` 并加入 `.gitignore`
12. **Vercel 部署失败时，第一步直接用 API 获取构建日志**，不要在 GitHub status 上猜原因（见「Vercel 故障排查」章节）
13. **部署成功（READY）但 API 返回 500 时，第一个命令必须是 `npx vercel logs`，禁止在运行这条命令之前做任何其他诊断**。不猜原因、不检查变量、不测试连接——先拿 runtime 日志，日志会直接告诉你报错文件和行号。（来源：010 事故，花了数十分钟才用到这个工具）

---

## Vercel 故障排查（Debugging Playbook）

### 第一判断：构建失败 vs 运行时失败

```
后端报 500
    │
    ▼
Vercel 部署状态？
    │
    ├─ ERROR（红色）→ 构建失败 → 看 Build Logs（Step 1 below）
    │
    └─ READY（绿色）→ 运行时崩溃 → 立刻执行：
           cd backend/
           npx vercel logs
           ← 禁止在此之前做任何其他诊断 ←
```

> **事故来源（dev-notes 010）**：READY + 500 的情况下，先猜 MongoDB 密码、检查网络设置、本地测试连接，耗时数十分钟。正确做法是第一步 `npx vercel logs`，30 秒内即可看到完整报错。有了初始假设后不要急着验证假设，先拿最直接的证据。

### Vercel 部署失败时的标准操作顺序

#### Step 1：用 API 直接拿构建日志（最快，最准确）

```bash
# 1. 获取 token
VERCEL_TOKEN=$(cat ~/Library/Application\ Support/com.vercel.cli/auth.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))")

# 2. 获取 team ID（只需一次）
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v2/teams" | python3 -c "import sys,json; [print(t['id'], t['slug']) for t in json.load(sys.stdin)['teams']]"

# 3. 列出最近几次部署，找到失败的 deployment ID
TEAM_ID="team_uK49RbOz3wMONs8lN3AoVN1d"
PROJECT_ID="prj_hbCWUW7FsV6hHLnWnMBUTYJ9J7xK"  # backend
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?teamId=$TEAM_ID&projectId=$PROJECT_ID&limit=3" | \
  python3 -c "import sys,json; [print(d['uid'], d['state'], d['meta'].get('githubCommitSha','')[:8]) for d in json.load(sys.stdin)['deployments']]"

# 4. 获取构建日志（把 <DEP_ID> 换成上面的 uid）
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v2/deployments/<DEP_ID>/events?teamId=$TEAM_ID&limit=100" | \
  python3 -c "import sys,json; [print(e['type'], ':', e.get('payload',{}).get('text','')) for e in json.load(sys.stdin) if e['type'] in ['stdout','stderr','error']]"
```

#### Step 2：常见错误模式速查

| 日志关键字 | 原因 | 修复方法 |
|-----------|------|---------|
| `Package Manager changed from pnpm to npm` | 子目录里有 `package-lock.json` 被 commit | `git rm <subdir>/package-lock.json` |
| `ERR_PNPM_OUTDATED_LOCKFILE` | `pnpm-lock.yaml` 与 `package.json` 不同步 | monorepo 根目录跑 `pnpm install` 重新生成 |
| `ENOENT: no such file or directory, stat '.../.pnpm/...'` | Vercel 用 npm 装包但 bundler 去找 pnpm 路径 | 同上，先解决 PM 误判问题 |
| `Cannot find module 'xxx'` | 新依赖未装或 lockfile 未更新 | `pnpm add xxx` 重新生成 lockfile |
| `frozen-lockfile` + `1 dependencies were added` | `package.json` 加了包但没跑 `pnpm install` | 跑 `pnpm install`，commit 更新后的 lockfile |

#### 项目各子项的 Vercel Project ID

| 子项 | Project ID | Production URL |
|------|-----------|----------------|
| backend | `prj_hbCWUW7FsV6hHLnWnMBUTYJ9J7xK` | backend-ten-azure-58.vercel.app |
| admin | `prj_GckJdUTQrXGzz2cYynqjL0uwD34a` | admin-kappa-ivory.vercel.app |
| frontend | `prj_kxmCFbTsCWssKdogugzyatSzNscg` | fooddelivery-2025.vercel.app |
| food-delivery-web | （未保存，可从 Vercel Dashboard 查） | food-delivery-web-eosin.vercel.app |
| Team ID | `team_uK49RbOz3wMONs8lN3AoVN1d` | — |

### 已知经验：Vercel 包管理器检测逻辑

Vercel 通过扫描 **各子目录** 内的锁文件来判断包管理器：
- 发现 `package-lock.json` → npm
- 发现 `yarn.lock` → yarn
- 发现 `pnpm-lock.yaml` → pnpm（只在项目 root 目录查找）

结论：**任何子目录内出现 `package-lock.json` 都会覆盖 monorepo 的 pnpm 设置**，必须删除。
