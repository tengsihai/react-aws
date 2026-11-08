# react-aws 前端工程

基于 **React + TypeScript + Vite** 的自检记录管理前端，包含增、删、改、查四个页面。
静态资源托管在 **Amazon S3**，通过 **Amazon CloudFront** 分发，使用 **GitHub Actions**
发布。

> 本仓库只负责前端应用与前端发布流水线。
> S3 / CloudFront / IAM 等基础设施由独立的**基础设施工程**创建，
> API Gateway + Lambda 接口由独立的**后端工程**实现。

---

## 功能

| 页面 | 路由 | 对应操作 |
| --- | --- | --- |
| 记录列表 | `/items` | 查：分页列表、跳转详情、删除 |
| 新建记录 | `/items/new` | 增：填写表单创建 |
| 记录详情 | `/items/:id` | 查：单条详情、payload 展示、编辑 / 删除入口 |
| 编辑记录 | `/items/:id/edit` | 改：部分更新，业务编号只读 |

其它细节：

- 删除操作有二次确认弹窗，避免误触
- 操作结果通过浮层提示（成功 / 失败）
- 分页以 `meta.total` 为准，删除当前页最后一条时自动回退一页
- 表单校验业务编号、名称、金额精度与 payload JSON 合法性
- 加载骨架屏、空状态、错误重试
- 适配移动端，支持 `prefers-reduced-motion`

## 技术栈

- React 19 + TypeScript
- Vite 6（构建）
- React Router 7（前端路由，History 模式）
- 原生 `fetch` 封装，无额外请求库

---

## 系统架构

```
                   ┌──────────────────────────────┐
   浏览器  ───────▶ │  Amazon CloudFront            │  ← 基础设施工程维护
                   │  默认行为：S3 源（OAC 签名）    │
                   └──────────────┬───────────────┘
                                  │
                                  ▼
                   ┌──────────────────────────────┐
                   │  Amazon S3（私有桶）           │
                   │  index.html + assets/*        │  ← 本仓库 CI 同步产物
                   └──────────────────────────────┘

   前端 fetch ───▶ API Gateway (HTTP API) ───▶ Lambda ───▶ 数据库
                   （后端工程维护，地址通过 VITE_API_BASE_URL 注入）
```

前端工程与基础设施工程的分工：

| 内容 | 归属 |
| --- | --- |
| S3 桶、CloudFront 分发（含 OAC、SPA 403/404 回退）、OIDC 部署角色 | 基础设施工程 |
| 前端源码、构建、发布流水线（同步 S3 + 刷新缓存） | 本仓库 |
| API Gateway / Lambda / 数据库 | 后端工程 |

前端依赖的两个关键约定（由基础设施工程保证）：

1. S3 桶可被部署角色写入，且只通过 CloudFront 访问（OAC 回源）。
2. CloudFront 对 403 / 404 返回 `index.html`（状态码 200），保证
   `/items/xxx` 这类前端路由直接访问不会 404。

---

## 目录结构

```
.
├── .github/workflows/
│   ├── ci.yml                 # PR 及 main/环境分支 push：类型检查 + 构建
│   ├── _deploy.yml            # 可复用发布流程：构建 → 同步 S3 → 刷新 CloudFront
│   ├── deploy-dev.yml         # 合并进 dev：发布 dev 环境
│   ├── deploy-staging.yml     # 合并进 staging：发布 staging 环境
│   └── deploy-prod.yml        # 合并进 prod：发布 prod 环境
├── src/
│   ├── api/items.ts           # 接口封装（后端契约集中在这里）
│   ├── components/            # 布局、表单、弹窗、提示等通用组件
│   ├── lib/format.ts          # 时间、金额、JSON 等格式化工具
│   ├── pages/                 # 四个页面 + 404
│   ├── App.tsx                # 路由表
│   ├── main.tsx               # 应用入口
│   ├── styles.css             # 全局样式
│   └── types.ts               # 类型与常量
├── index.html
├── vite.config.ts
└── package.json
```

---

## 本地开发

要求 Node.js 20 及以上（推荐 22，见 `.nvmrc`）。

```bash
npm ci
cp .env.example .env.local   # 填入后端 API 地址
npm run dev                  # http://localhost:5173
```

可用脚本：

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run build` | 类型检查 + 生产构建（输出到 `dist/`） |
| `npm run preview` | 本地预览构建产物 |

环境变量：

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API Base URL（**已包含 stage 前缀**），例如 `https://x4oneny2hi.execute-api.ap-northeast-1.amazonaws.com/dev`。不要以 `/` 结尾。 |

未配置时页面顶部会显示醒目提示，接口请求会直接失败并给出说明。

---

## 后端接口约定

对应后端「自检记录 API」（表 `t_migration_check`，仅用于验证发布链路），
实现见 [`src/api/items.ts`](src/api/items.ts)。

Base URL 已包含 stage 前缀，通过 `VITE_API_BASE_URL` 注入，例如
`https://x4oneny2hi.execute-api.ap-northeast-1.amazonaws.com/dev`。

| 方法 | 路径 | 说明 | 成功响应 |
| --- | --- | --- | --- |
| `GET` | `/items?limit=&offset=` | 分页列表，按 `id` 倒序 | `200 { data: Item[], meta: { total, limit, offset } }` |
| `POST` | `/items` | 新建 | `201 { data: Item }` |
| `GET` | `/items/{id}` | 单条查询 | `200 { data: Item }` |
| `PUT` | `/items/{id}` | 部分更新，只提交要改的字段 | `200 { data: Item }` |
| `DELETE` | `/items/{id}` | 软删除 | `204`，无响应体 |

`Item` 结构：

```json
{
  "id": 6,
  "biz_no": "BIZ-0001",
  "name": "示例记录",
  "status": 1,
  "amount": "12.50",
  "payload": { "source": "web" },
  "remark": "可选备注",
  "is_deleted": 0,
  "created_at": "2026-11-07 05:30:00",
  "updated_at": "2026-11-07 05:30:00"
}
```

- `status`：`0` 待处理 / `1` 处理中 / `2` 已完成
- `amount`：**字符串**，避免精度丢失，前端不做数值运算
- `payload`：任意 JSON，可为 `null`
- `biz_no`：创建后不可修改，更新时传入会被后端忽略
- 时间为服务端原样字符串，无时区后缀，前端按原值展示

失败响应统一为 `{ "code": "...", "message": "..." }`，前端直接展示 `message`：

| HTTP | `code` |
| --- | --- |
| 400 | `VALIDATION_ERROR` |
| 404 | `NOT_FOUND` |
| 500 | `INTERNAL_ERROR` |

> 重复 `biz_no` 目前返回 **500 `INTERNAL_ERROR`** 而非 409，前端会原样提示。

**CORS**：前端与 API 不同源，后端必须返回 `Access-Control-Allow-Origin`
并正确响应 `OPTIONS` 预检（`Content-Type` 会触发预检）。

---

## 发布

### 环境

**分支即环境，合并 PR 就是审批，`main` 只归档不部署。**
三个环境通过 GitHub Environments 隔离配置，各自对应一条同名分支。

| 环境 | 工作流 | 触发方式 | 来源分支 | 用途 |
| --- | --- | --- | --- | --- |
| `dev` | `deploy-dev.yml` | 合并进 `dev` 自动触发 | `dev` | 日常发布 |
| `staging` | `deploy-staging.yml` | 合并进 `staging` 自动触发 | `staging` | 预发验证 |
| `prod` | `deploy-prod.yml` | 合并进 `prod` 自动触发 | `prod` | 生产 |

环境标识会作为 `VITE_APP_ENV` 注入构建产物，页面顶部会显示 `dev` / `staging` / `prod`
徽标（本地开发显示 `local`），方便确认当前访问的是哪套环境。

- **没有 `workflow_dispatch`**：发布只由「合并进环境分支」触发，不提供手动选环境发布的入口。
- 未接入的环境由仓库变量 `DEPLOY_ENVIRONMENTS` 控制（默认 `["dev"]`），
  不在列表里的环境会跳过部署 job，不产生红叉。
- `prod` 建议在 `Settings → Environments → prod` 中配置 **Required reviewers**，
  让生产发布在合并之外再经一道人工审批。

### 分支模型

```
feature/xxx ──PR──► dev ──PR──► staging ──PR──► prod ──PR──► main（归档）
                      │          │              │
                      └ 发布 dev └ 发布 staging  └ 发布 prod
```

- **`dev` / `staging` / `prod`**：环境分支，分支名即环境名。合并进哪条分支，
  就发布哪个环境；合并动作即审批。
- **功能分支**：`feature/*`、`fix/*` 等，从 `dev` 切出，提交 PR 后由人工评审合并回 `dev`。
  不要在 `main` 或环境分支上直接开发。
- **`main`**：只存放**发布成功后**的归档快照，不触发任何部署。归档走
  `prod → main` 的 PR（合并 PR 即完成归档），不再由流水线自动快进。

> 建议在 GitHub 仓库 `Settings → Branches` 中为 `dev` / `staging` / `prod` 配 ruleset：
> 必须走 PR、必须通过 `持续集成` 检查、禁止直接 push。`prod` 再加 Required reviewers。

### 发布前置配置（由基础设施工程提供）

本仓库不创建任何 AWS 资源。**每个环境分别配置一套变量**，Secret 可在仓库级共享：

`Settings → Environments → <env>` 中创建 `dev` / `staging` / `prod` 三个环境，并配置：

| 名称 | 类型 | 作用域 | 说明 |
| --- | --- | --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | Secret | 仓库级或环境级 | 部署角色 ARN，Actions 通过 OIDC 扮演它 |
| `S3_BUCKET_NAME` | Variable | 每个环境 | 前端静态资源桶名 |
| `CLOUDFRONT_DISTRIBUTION_ID` | Variable | 每个环境 | 需要刷新缓存的 CloudFront 分发 ID |
| `VITE_API_BASE_URL` | Variable | 每个环境 | 对应环境的后端 API 地址 |
| `AWS_REGION` | Variable | 每个环境，可选 | 默认 `ap-northeast-1` |

配置命令示例（`--env` 用于指定环境作用域）：

```bash
# 共享的部署角色
gh secret set AWS_DEPLOY_ROLE_ARN --repo tengsihai/react-aws --body "arn:aws:iam::<account-id>:role/<deploy-role>"

# dev 环境
gh api --method PUT repos/tengsihai/react-aws/environments/dev
gh variable set S3_BUCKET_NAME             --repo tengsihai/react-aws --env dev --body "<dev-bucket>"
gh variable set CLOUDFRONT_DISTRIBUTION_ID --repo tengsihai/react-aws --env dev --body "<dev-distribution-id>"
gh variable set VITE_API_BASE_URL          --repo tengsihai/react-aws --env dev --body "https://x4oneny2hi.execute-api.ap-northeast-1.amazonaws.com/dev"

# staging / prod：等基础设施就绪后按同样方式配置 --env staging / --env prod
```

仓库级变量 `DEPLOY_ENVIRONMENTS`（Settings → Secrets and variables → Actions →
Variables）决定哪些环境允许自动发布，默认 `["dev"]`；接入新环境时改成
`["dev","staging","prod"]`。

> 未配置变量的环境在工作流运行时会停在「校验发布配置」步骤，并明确指出缺少哪一项。

部署角色的信任策略按 **GitHub Environment** 限定，每个环境一个角色；
以下是 `dev` 的示例：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:tengsihai/react-aws:environment:dev"
        }
      }
    }
  ]
}
```

角色所需的最小权限（资源替换为实际值）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "arn:aws:s3:::<frontend-bucket>"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging",
        "s3:DeleteObjectTagging"
      ],
      "Resource": "arn:aws:s3:::<frontend-bucket>/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListInvalidations",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation"
      ],
      "Resource": "arn:aws:cloudfront::<account-id>:distribution/<distribution-id>"
    }
  ]
}
```

### 发布流水线做了什么

`_deploy.yml` 是三个环境共用的可复用工作流，由各环境工作流传入 `environment` 调用：

1. 检出代码、校验该环境的发布配置（缺少变量直接失败）
2. 安装依赖并执行 `npm run build`（类型检查 + 生产构建，注入 `VITE_API_BASE_URL` 与 `VITE_APP_ENV`）
3. 通过 OIDC 获取 AWS 临时凭证
4. 确认目标 S3 桶与 CloudFront 分发存在
5. 同步 `dist/` 到 S3（`--delete`，删除已不存在的旧文件）
6. 创建 CloudFront 缓存失效（`/*`），在 Actions 摘要中输出发布信息

`main` 不参与发布：它只通过 `prod → main` 的 PR 归档，不触发任何部署。

### 缓存策略

| 文件 | Cache-Control | 原因 |
| --- | --- | --- |
| `assets/*`（文件名带内容哈希） | `public, max-age=31536000, immutable` | 内容变化会生成新文件名，可长期缓存 |
| `index.html` | `no-cache, no-store, must-revalidate` | 必须能立即拿到最新的资源引用 |

### 回滚

发布的是环境分支的提交，回滚即恢复到上一个可用版本。以 dev 为例：

```bash
git revert <有问题的提交>
# 提交 PR 合并回 dev，流水线会自动重新发布
```

生产回滚同样在 `prod` 分支上 revert 并合并；之后按正常流程把 `prod` 合并到
`main` 更新归档快照。

---

## 常见问题

**直接访问 `/items/xxx` 出现 404 / AccessDenied？**
前端路由依赖 CloudFront 把 403 / 404 回退到 `index.html`。该行为由基础设施工程配置，
若缺失请联系基础设施负责人调整 CloudFront 自定义错误响应。

**浏览器控制台报 CORS 错误？**
跨域限制由后端返回的响应头决定。请后端工程允许 CloudFront 域名
（或 `*`）以及 `Content-Type` 请求头。

**流水线启动后立刻失败？**
检查上文的四个 Secret / Variable 是否配置完整；`校验发布配置` 与
`确认目标资源存在` 两个步骤会给出具体缺失项。

**接口 404 / 405？**
确认 `VITE_API_BASE_URL` 是否包含后端所需的 stage 前缀，以及后端是否实现了
上文约定的路径。

## 相关工程

| 工程 | 职责 |
| --- | --- |
| 本仓库 | React 前端、前端发布流水线 |
| 基础设施工程 | S3、CloudFront、IAM 部署角色、OIDC Provider |
| 后端工程 | API Gateway、Lambda、数据库 |
