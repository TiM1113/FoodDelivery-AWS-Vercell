# FoodDelivery-AWS-Vercell — Claude Code 项目上下文

> 此文件在每次 Claude Code 对话启动时自动加载。包含完整的项目状态、升级计划和操作规范。

---

## 项目基本信息

- **仓库**：https://github.com/TiM1113/FoodDelivery-AWS-Vercell.git
- **本地路径**：`/Users/timyuan/Desktop/2025-2026-Career/2026-Antigravity-GitHub-Clones/FoodDelivery-AWS-Vercell`
- **部署平台**：Vercel（Serverless）
- **当前分支**：main（125 个 commits）
- **当前版本**：v0.2.0（Phase 2 完成，2026-03-26）
- **项目性质**：食品外卖平台，三端架构（apps/web + backend + admin）

---

## 当前技术栈（旧版）

| 层级 | 技术 | 版本 |
|------|------|------|
| Frontend | React + Vite + Context API | React 18.3, Vite 5.4 |
| Admin | React + Vite（独立项目） | React 18.3, Vite 6.0 |
| Backend | Hono + TypeScript + PostgreSQL + Drizzle ORM | Hono 4.x, Drizzle 0.45, Neon Serverless |
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
│   └── web/           Next.js 15 用户端（Phase 2 前端轨道完成）
│       ├── src/app/   App Router（layout + page + API routes）
│       ├── src/auth.ts        NextAuth.js v5 config
│       ├── src/proxy.ts       Route protection（替代 middleware.ts）
│       ├── src/components/    Navbar / Footer / auth / shadcn/ui
│       └── next.config.ts
├── backend/           服务器（Hono + TypeScript + MongoDB）
│   ├── app.ts                          Hono 入口（CORS / 路由 / 错误处理）
│   ├── serve.ts                        本地 dev server（@hono/node-server）
│   ├── types.ts                        AppEnv 类型定义
│   ├── controllers/*.ts                TypeScript 控制器（Hono Context API）
│   ├── middleware/auth.ts              JWT + Cookie 验证（hono/cookie）
│   ├── middleware/validateRequest.ts   Zod v4 请求校验
│   ├── db/schema.ts                    Drizzle ORM schema（PostgreSQL 表定义）
│   ├── db/index.ts                     Drizzle client（Neon HTTP driver）
│   ├── db/helpers.ts                   响应格式转换（id→_id 兼容层）
│   └── api/index.ts                    Vercel Serverless 适配器（hono/vercel）
├── admin/             管理后台（React + Vite，Phase 2 Admin 轨道升级前保留）
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

**设计原则**：三条轨道按顺序执行——前端优先（用户可见）→ 后端（技术升级）→ Admin（用户量最少）。前端全部完成后再动后端，因为新前端调用的是 HTTP 接口，不关心后端是 Express 还是 Hono。

**技术目标清单**（贯穿所有 Step，逐步引入）：
- Next.js 15 App Router（SSG + ISR + SSR）
- TanStack Query v5（数据缓存 + 乐观更新）
- Zustand 5（客户端状态：购物车）
- Tailwind CSS v4 + shadcn/ui（样式，每个 Step 同步迁移）
- Next.js Image（图片优化）
- NextAuth.js v5（认证，Step 2 已完成）
- Hono（替代 Express，后端轨道）
- Drizzle ORM（替代 Mongoose，后端轨道）
- S3 预签名 URL 直传（后端轨道）
- TanStack Table v8 + React Hook Form + Zod（Admin 轨道）

---

#### 前端轨道（用户端迁移，Step 1-8）

| Step | 内容 | 状态 | PR |
|------|------|------|-----|
| **Step 1** | Next.js 15 Shell（Navbar + Footer + 占位页面 + Tailwind/shadcn 基础） | ✅ 完成 | #13 |
| **Step 2** | NextAuth.js v5 认证（登录表单 + 路由保护 + Session Navbar） | ✅ 完成 | #15, #16 |
| **Step 3** | 食品列表（SSG+ISR + TanStack Query + 分类过滤 + 搜索 + Next.js Image） | ✅ 完成 | #18 |
| **Step 3.5** | 暗色模式（next-themes + CSS 变量调优 + 语义化颜色替换） | ✅ 完成 | #19 |
| **Step 4** | 购物车（Zustand store + 卡片加购按钮 + 购物车页面 + Navbar 角标） | ✅ 完成 | #20 |
| **Step 4.5** | 测试基础设施（Vitest + RTL + MSW + husky + CI lint/test job） | ✅ 完成 | — |
| **Step 5** | 结账（下单表单 + 地址填写 + Stripe 支付 + 支付结果页） | ✅ 完成 | #23 |
| **Step 6** | 我的订单（SSR + 订单列表 + 订单状态跟踪） | ✅ 完成 | #24 |
| **Step 7** | 注册页（注册表单 + 自动登录 + 跳转） | ✅ 完成 | #25 |
| **Step 8** | 旧 frontend 退役（删除旧 frontend/ 代码，更新 monorepo 配置） | ✅ 完成 | — |

> Step 8 完成后，用户端功能 100% 对齐旧版，且体验全面超越（SSG 秒开、Image 优化、httpOnly Cookie、Tailwind UI）。

**Step 3 详情**：
- 安装 `@tanstack/react-query`，新建 QueryProvider 包裹 layout
- 新建 `src/lib/api.ts`：封装 `fetchFoodList()`，服务端 + 客户端共用
- 首页 Server Component 调用 API 获取食品数据（SSG + ISR revalidate=300）
- 数据传给 Client Component，TanStack Query 以 `initialData` 接管客户端缓存
- 分类过滤：迁移旧版 ExploreMenu 的 8 个圆形分类图标 + "All" 按钮，纯客户端 `.filter()`
- 搜索：客户端过滤（名称 / 描述 / 分类），不请求后端
- 食品卡片：shadcn/ui Card + Next.js Image + 名称 + 描述 + 价格 + 星级装饰
- FoodCard 预留 `action` slot，供 Step 4 插入加购按钮
- 添加 shadcn/ui Card + Skeleton 组件
- 响应式网格：1列 → 2列 → 3列 → 4列

**Step 4 详情**：
- 新建 Zustand cart store（替代旧 StoreContext 的 cartItems 逻辑）
- FoodCard 插入加购按钮（+/- 数量，未登录点击跳转登录页）
- 购物车页面 `/cart`：商品列表 + 数量调整 + 小计/总价 + 清空 + 去结账
- Navbar 购物车图标显示数量角标
- 购物车数据通过 `/api/cart/add|remove|get` 与后端同步

**Step 5 详情**：
- 下单页面 `/checkout`：收货地址表单（React Hook Form + Zod 校验）
- 调用 `/api/order/place` 创建订单 + 跳转 Stripe 支付
- 支付结果页 `/verify`：轮询订单状态 + 成功/失败提示

**Step 6 详情**：
- 我的订单页面 `/myorders`：SSR 服务端渲染（每次请求实时获取）
- 订单列表：商品缩略图 + 数量 + 金额 + 状态 badge + 时间
- 订单状态追踪按钮

**Step 7 详情**：
- 注册页面 `/register`：邮箱 + 密码 + 姓名
- 调用后端 `/api/user/register`，成功后自动调用 `signIn()` 登录
- 登录页增加「没有账号？去注册」链接，注册页增加「已有账号？去登录」链接

**Step 8 详情**：
- 确认 apps/web 全部功能正常后，删除 `frontend/` 目录
- Vercel 将 fooddelivery-2025.vercel.app 域名指向 apps/web 项目（或设置重定向）
- 更新项目 README 和 CLAUDE.md 中的结构说明

---

#### 后端轨道（技术升级，Step 9-11）

> 前提：前端轨道（Step 8）全部完成后再开始。现有 Express 后端功能正常，迁移是技术升级，不是修 bug。

| Step | 内容 | 状态 |
|------|------|------|
| **Step 9** | Express → Hono（Edge-first，TypeScript 原生，API 接口保持不变） | ✅ 完成 | #27 |
| **Step 10** | MongoDB/Mongoose → PostgreSQL/Drizzle ORM + 事务 + 服务端金额计算 | ✅ 完成 | #28, #33 |
| **Step 11** | S3 预签名 URL 直传（绕过服务器，减少带宽） | ✅ 完成 | #34 |

---

#### Admin 轨道（Step 12-13）

> 前提：后端轨道完成后再开始。Admin 是内部工具，优先级最低。

| Step | 内容 | 状态 | PR |
|------|------|------|-----|
| **Step 12** | Admin 合并入 apps/web `/admin` 路由组（受 RBAC 保护，不再是独立项目） | ✅ 完成 | #35 |
| **Step 13** | Admin 表格改用 TanStack Table v8 + 表单改用 React Hook Form + Zod | ✅ 完成 | #36 |

> Step 13 完成后，旧 `admin/` 目录退役删除。Phase 2 结束，打 v0.2.0 tag。

---

### Phase 3 计划：工程质量

**目标**：扩展测试覆盖率 + 建立可观测性体系（基础测试设施已在 Step 4.5 搭建，关键路径测试在 Step 5-8 同步编写）

- **Vitest 覆盖率提升**：补充边界场景测试，设置覆盖率门槛（CI 中低于阈值则阻断合并）
- **Playwright E2E**：扩展关键用户旅程覆盖（注册→点餐→支付→查看订单→暗色模式切换）
- **Sentry**：前后端全链路错误追踪
- **Vercel Analytics + Speed Insights**：监控 Core Web Vitals
- **Dependabot**：自动依赖安全更新

---

### Phase 4 计划：产品功能补全

**目标**：填补现有功能缺口，达到商业发布标准

- **优惠码系统**：后端存储、前端校验、Stripe discount 集成（当前 UI 已有入口但未实现）
- **订单实时状态推送**：Vercel KV + SSE 或 WebSocket
- **用户个人中心**：编辑资料、收货地址管理
- **食品高级搜索**：MongoDB Atlas Search 全文搜索（升级 Phase 2 Step 3 的客户端搜索为服务端搜索，支持拼写纠错、模糊匹配）
- **分页加载**：Cursor-based pagination（适配 Serverless）
- **订单取消 + 退款**：已支付订单的 Stripe 退款流程
- **Admin 数据看板**：销售额趋势、热销品类、订单转化率（Recharts）
- **法律合规**：Privacy Policy、Terms of Service 页面（澳洲隐私法要求）
- **Stripe KYC 验证**：完成商家身份核实，解锁真实收款

---

## Phase 1 计划（已完成 ✅ v0.1.0）：地基重建

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
①.5 调研现状（读旧版代码 + 后端 API + 已有模式 + 相关组件），摸清架构后再给方案
② git checkout -b phase2/stepN-name
③ 写功能代码
③.5 安装新包用 pnpm add（绝不用 npm install）
④ 写测试代码（和功能代码同批次，覆盖关键路径）
⑤ pnpm test（本地 Vitest 全绿才继续）
⑥ 三阶段验证
   ├── A：Playwright CLI headless 功能测试 + Console 无报错（含完整认证链路）
   ├── B：3 分辨率截图对比（旧版 vs 新版）
   └── C：用户本地浏览器确认 OK → 等待用户反馈
⑥.5 提前自检（避免后续闸门打回）
   ├── ESLint：`pnpm --filter @food-delivery/web exec eslint src/`（和 pre-commit hook 同内容，提前跑避免 commit 被拒）
   └── Build：`pnpm --filter @food-delivery/web build`（和 Vercel 同内容，提前跑避免部署失败）
⑦ 按逻辑分批 git commit（功能代码 + 测试代码一起，Conventional Commits 格式）
⑦.5 push 前：`git status` 检查，确认无 `package-lock.json`、无 `.env`、无 `node_modules`
⑧ git push → 创建 Pull Request
⑨ CI 自动跑（typecheck → lint → test → build，任一红了不让合并）
⑩ Snyk 安全扫描（自动）
⑪ CodeRabbit AI Review（自动）
⑫ 处理反馈：Must Fix 自动修复 → 重新 push → CI 重跑
⑬ 全绿 → 问用户是否合并 → Squash and Merge
⑭ Vercel 自动部署 → 浏览器验证上线效果
⑮ git checkout main && git pull && git branch -d branch-name
⑯ 写 dev-notes 文档（见下方 dev-notes 规范）
```

### 本地 Git Hooks（自动执行，无需手动触发）

| Hook | 触发时机 | 做什么 |
|------|----------|--------|
| `pre-commit` | 每次 `git commit` | lint-staged 对暂存的 ts/tsx 文件跑 ESLint |
| `pre-push` | 每次 `git push` | `pnpm --filter @food-delivery/web test --run`，红了推不上去 |

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

### 大白话理解风格（Rule 8 — 用于 dev-notes）

- 先用生活类比说明「现在有什么问题」（一句话能懂，禁止术语堆砌）
- 再说「这步做了什么」（类比解释，零基础读者能理解）
- 再说「为什么现在做，不能跳过」（说清楚和前后步骤的逻辑依赖关系）
- 最后用对比表格收尾（两列：之前 vs 之后，或：概念 vs 类比）

### 方案说明风格（Rule 15 — 用于每个 Step 执行前的方案）

每个 Step 执行前的方案说明必须包含「大白话新旧对比」，以 Step 4 购物车方案为标准模板。核心要求：

1. **按改动点逐项对比**：每个核心改动单独一节，标题用「生活类比概括」（如「从大喇叭换成对讲机」），不要用纯技术标题
2. **旧版怎么做 → 新版怎么做**：每节先讲旧版的实现方式和问题，再讲新版的方案和优势。用 ASCII 图或伪代码辅助，但必须配文字类比解释
3. **解释"为什么"而不只是"是什么"**：不能只说"我们用 Zustand 替代 Context"，必须解释 Context 有什么问题、Zustand 为什么能解决、两者的本质区别是什么
4. **技术选型要有对比表格**：列出候选方案及其优缺点，说明为什么选这个而不选那个
5. **禁止纯术语堆砌**：每出现一个技术概念，必须紧跟一个括号类比或一句大白话解释。例如：「Zustand 有 selector 机制（只订阅自己关心的数据，其他数据变了不通知你）」
6. **最后给改动范围表格 + 文件清单**：让用户一目了然知道会动哪些文件

---

## 测试规范（Code Test）

### 三种测试类型

| 类型 | 工具 | 作用 | 执行时机 |
|------|------|------|---------|
| Unit Test（单元测试） | Vitest | 测试单个函数逻辑（如计算总价、校验格式） | 本地开发时 + CI |
| Integration Test（集成测试） | Vitest + RTL + MSW | 测试组件渲染 + API 代理路由 + 状态管理流程 | 本地开发时 + CI |
| E2E Test（端到端测试） | Playwright | 模拟真实用户操作完整旅程 | CI（Phase 3 扩展覆盖） |

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
2. **方案说明必须用「大白话对比」风格**（详见下方「方案说明风格」章节）。禁止纯技术术语堆砌，必须用生活类比让零基础读者能理解每个改动的原因和逻辑
3. 每个 Step 完成后，执行「三阶段验证」，禁止跳过任何一步：
   - **阶段 A — headless 功能测试**：用 Playwright CLI headless 验证交互功能 + Console 无报错
   - **阶段 B — 自动截图对比**：见下方「阶段 B 截图对比规则」
   - **阶段 C — 用户本地浏览器验证**：启动 dev server → 给出本地 URL → 提醒用户打开浏览器 → **等待用户反馈** → 用户确认 OK 后才能 commit + push + PR。此步主要让用户确认动画流畅度、滚动手感等截图无法体现的体验细节
3. **三阶段验证全部通过前，禁止创建 PR**

### 阶段 B — 自动截图对比规则

#### 截图命令规范

每次执行阶段 B 时，按以下流程截图，文件统一保存到 `.playwright-cli/` 目录：

**线上旧版截图（参考基准）：**
```bash
# Desktop 1440px
playwright-cli open --browser=chromium <旧版URL>
playwright-cli resize 1440 900
playwright-cli screenshot --filename=.playwright-cli/ref-desktop-1440.png

# Tablet 768px
playwright-cli resize 768 1024
playwright-cli screenshot --filename=.playwright-cli/ref-tablet-768.png

# Mobile 375px
playwright-cli resize 375 812
playwright-cli screenshot --filename=.playwright-cli/ref-mobile-375.png
playwright-cli close
```

旧版参考 URL：
- frontend 对标 → `https://fooddelivery-2025.vercel.app`
- apps/web 对标 → `https://food-delivery-web-eosin.vercel.app`

**本地新版截图（待审核）：**
```bash
# Desktop 1440px
playwright-cli open --browser=chromium http://localhost:3000
playwright-cli resize 1440 900
playwright-cli screenshot --filename=.playwright-cli/new-desktop-1440.png

# Tablet 768px
playwright-cli resize 768 1024
playwright-cli screenshot --filename=.playwright-cli/new-tablet-768.png

# Mobile 375px
playwright-cli resize 375 812
playwright-cli screenshot --filename=.playwright-cli/new-mobile-375.png
playwright-cli close
```

> 需要截多个滚动位置时，在每个 resize 后用 `playwright-cli eval "window.scrollTo(0, Y)"` 滚动并追加截图（如 `ref-desktop-1440-menu.png`、`ref-desktop-1440-grid.png`）。

#### 截图完成后，AI 必须逐一对比并输出报告

对比维度：
1. **布局结构**：间距、对齐、栅格是否一致
2. **视觉层级**：标题/正文/按钮大小关系是否清晰
3. **颜色还原**：主色/辅色/背景色是否与旧版一致
4. **响应式适配**：移动端是否有元素溢出、重叠、过小
5. **差异标注**：列出所有与旧版不同的地方，标明是预期改动还是意外变化

报告格式：
- ✅ 一致项
- ⚠️ 差异项（说明差异内容 + 是否符合预期）
- 🎨 视觉提升建议（可选改进点）

#### 重要约束

- 截图文件命名固定，每次覆盖，不产生时间戳文件
- dev server 必须在截图前已启动
- 如果截图失败，报告原因，不得跳过直接 commit
- `.playwright-cli/` 目录已在 `.gitignore` 中，不会被提交
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
14. **PR 创建后必须自动执行审核循环，不等用户要求**：push + 创建 PR 后，立刻自动轮询 CI 状态 → 读取 CodeRabbit / Snyk 反馈 → 有 Major/Must Fix 自动修复并重新 push → 全部通过后直接问用户「是否合并」。禁止在 PR 创建后停下来等用户手动催促检查反馈。
15. **观察优先原则（Observe Before Act）：任何异常发生时，第一步必须获取最直接的运行时证据，禁止基于源码阅读、过往经验或逻辑推理直接修改代码。** 源码 ≠ 运行时。读过代码不等于验证了行为。本规则覆盖以下所有场景（不限于此）：
    - a) 构建失败 → 先拿构建日志（Vercel API），不猜（Rule 12 的具体操作）
    - b) 部署成功但 API 500 → 先跑 `npx vercel logs`，不猜（Rule 13 的具体操作）
    - c) API 返回非预期结果 → 先 curl 实际端点看真实响应，不改代码
    - d) Stage A 验收 → 必须跑完整认证链路（登录 → 操作 → 验证 API 响应 → 验证 UI），不能只测「门口」就宣布通过
    - **违反信号**（出现以下任何一条说明你在猜，应立刻停下来去观察）：
      - 「应该是 XX 的问题」但没有看到实际报错
      - 连续修改同一文件超过 2 次但问题没解决
      - 修改了代码但没有先确认当前运行时到底返回/输出了什么
    - 来源：dev-notes 010（READY+500 花了数十分钟猜测，`npx vercel logs` 30 秒定位）；Step 4 事故（读了 userController.js 就假设生产返回 userId，改了 auth.ts 3 次才想到 curl 生产后端；Stage A 只测了未登录重定向，57 分钟调试时间本可避免）
16. **PR 前必须完成 checklist（禁止跳步）：** 每个 Step 提交 PR 前，必须按顺序完成以下检查：
    - □ a) 功能代码已写完
    - □ b) 测试代码已写完（至少覆盖关键路径：核心业务逻辑 + API 代理 + 状态管理）
    - □ c) `pnpm test` 本地全绿
    - □ d) 阶段 A — headless 功能测试通过（含完整认证链路，Rule 15d）
    - □ e) 阶段 B — 3 分辨率截图对比完成
    - □ f) 阶段 C — 用户本地浏览器确认 OK
    - □ g) `git status` 检查：无 `package-lock.json` / `.env` / `node_modules`
    - 只有全部 ✅ 才能 push + 创建 PR。
    - **流程违反信号**（出现以下任何一条说明流程被跳过，应立刻停下来补齐）：
      - 准备 push 但 `src/` 下没有 `.test.ts` / `.test.tsx` 文件
      - 阶段 A 只测了未登录场景就说通过
      - PR 创建后等用户催才去看 CodeRabbit 反馈（违反 Rule 14）

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
