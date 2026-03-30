# 🚫 BlackList Hub · 外贸买家风险预警平台（Next.js版）

> 收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益。

![Platform](https://img.shields.io/badge/Platform-Vercel-black?logo=vercel)
![Framework](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ 功能特性

- 🔍 **多字段搜索** — 支持按买家姓名、邮箱、电话、收货地址、平台 ID 联合查询
- 🏷️ **平台筛选** — 快速过滤 Amazon / eBay / Shopify / AliExpress / Wish 等平台
- 🎯 **风险等级** — 高 / 中 / 低 三级风险标记，颜色直观区分
- 💰 **金额记录** — 记录订单金额、退款金额、威胁拒付金额
- 📦 **货物损失** — 记录货物损失信息和承担方
- 📷 **证据截图** — 上传损失截图作为证据
- 🔗 **关联查询** — 自动关联同一买家的不同记录
- 📋 **举报提交** — 任何人可提交举报，进入人工审核队列
- 🔐 **管理员后台** — 审核通过 / 驳回 / 批量操作

---

## 🚀 快速部署

### 第一步：创建 Supabase 数据库

1. 前往 [supabase.com](https://supabase.com) 注册并创建项目
2. 进入项目 → **SQL Editor** → 执行 `schema.sql` 中的SQL
3. 在 **Storage** 中创建存储桶：`evidence-images`（私有）
4. 记录 **Project URL** 和 **Anon Key**

### 第二步：安装依赖

```bash
npm install
```

### 第三步：配置环境变量

复制 `.env.local.example` 为 `.env.local`，填写：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase Anon Key
NEXT_PUBLIC_ADMIN_ACCOUNT=admin
NEXT_PUBLIC_ADMIN_PASSWORD=你的管理员密码
```

### 第四步：运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 第五步：部署到 Vercel

```bash
npm run build
vercel
```

或连接 GitHub 仓库自动部署。

---

## 🗂️ 项目结构

```
blacklist-hub/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 前台首页
│   │   ├── globals.css        # 全局样式
│   │   └── admin/page.tsx     # 管理后台
│   ├── components/
│   │   ├── stats-cards.tsx    # 统计卡片
│   │   ├── search-form.tsx    # 搜索表单
│   │   ├── blacklist-table.tsx # 黑名单表格
│   │   ├── report-form.tsx    # 举报表单
│   │   ├── detail-modal.tsx   # 详情弹窗
│   │   └── admin-panel.tsx    # 管理面板
│   ├── lib/
│   │   ├── supabase.ts        # Supabase客户端
│   │   └── utils.ts           # 工具函数
│   └── types/
│       └── index.ts           # 类型定义
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📄 License

MIT
