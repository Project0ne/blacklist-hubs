# 🚫 BlackList Hub · 外贸买家风险预警平台（Next.js版）

> 收录恶意仅退款、虚假纠纷、空包诈骗等高风险买家信息，保护外贸卖家合法权益。

![Platform](https://img.shields.io/badge/Platform-Vercel-black?logo=vercel)
![Framework](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue)

---

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-name=blacklist-hubs&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_ADMIN_ACCOUNT,NEXT_PUBLIC_ADMIN_PASSWORD)

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

## 🚀 一键部署

点击上方按钮或直接访问：[**Deploy to Vercel**](https://vercel.com/new/clone?repository-name=blacklist-hubs)

### 部署后配置

1. **部署完成后**，进入 Vercel 项目设置 → **Environment Variables**
2. 添加以下环境变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase Anon Key
   NEXT_PUBLIC_ADMIN_ACCOUNT=admin
   NEXT_PUBLIC_ADMIN_PASSWORD=你的管理员密码
   ```
3. 重新部署项目（Vercel 会自动重新部署）

### 配置 Supabase（第一次使用）

1. 前往 [supabase.com](https://supabase.com) 创建项目
2. 在 **SQL Editor** 执行 `schema.sql`
3. 在 **Storage** 创建桶 `evidence-images`（私有）
4. 将 Supabase 的 URL 和 Anon Key 填入 Vercel 环境变量

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
