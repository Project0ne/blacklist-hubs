# 🚫 BlackList Hub · 外贸买家风险预警平台

> 收录恶意仅退款、虚假纠纷、信用卡拒付欺诈等高风险买家信息，保护跨境电商卖家合法权益。

![Platform](https://img.shields.io/badge/Platform-Vercel-black?logo=vercel)
![Framework](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)
![Database](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue)

---

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-name=blacklist-hubs&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_ADMIN_ACCOUNT,NEXT_PUBLIC_ADMIN_PASSWORD)

## ✨ 功能特性

- 🔍 **多字段搜索** — 支持按买家姓名、邮箱、电话、收货地址、平台 ID 联合查询
- 🏷️ **多平台覆盖** — Amazon / eBay / Shopify / AliExpress / Wish / Etsy / Walmart / Shopee / TikTok Shop / TEMU / SHEIN / Alibaba / SHOPLAZZA / OZON，支持自定义平台
- 🎯 **风险等级** — 高 / 中 / 低 三级风险标记，颜色直观区分
- 💰 **金额追踪** — 记录总订单金额、退款/拒付金额、损失承担方
- 💸 **白嫖金额统计** — 自动计算累计白嫖金额（总订单 - 退款/拒付），列表红色醒目显示
- 🔒 **隐私模糊** — 邮箱、电话、地址默认 CSS 模糊处理，悬停可见，保护隐私
- 📷 **证据截图** — 上传损失截图作为证据（支持 tinypng 压缩提示）
- 🔗 **关联查询** — 自动关联同一买家的不同记录
- 📋 **举报提交** — 任何人可提交举报，进入人工审核队列
- 🔐 **管理员后台** — 审核通过 / 驳回 / 批量操作

### 📝 举报表单字段

| 字段 | 必填 | 说明 |
|------|------|------|
| 买家姓名 | ✅ | — |
| 平台 | — | 支持 14+ 个主流跨境电商平台及自定义 |
| 平台 ID | — | 买家在平台上的 ID |
| 邮箱地址 | ✅ | — |
| 电话号码 | ✅ | — |
| 收货地址 | ✅ | — |
| 风险等级 | ✅ | 高 / 中 / 低 |
| 纠纷类型 | ✅ | 12 种预设类型 + 自定义"其他" |
| 总订单金额 | — | — |
| 退款/拒付金额 | — | — |
| 损失承担方 | — | 自己承担 / 平台承担 / 部分承担 |
| 损失截图 | — | 最多 5 张，建议 tinypng 压缩 |
| 详细说明 | ✅ | — |

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
│   │   ├── blacklist-table.tsx # 黑名单表格（含模糊隐私 + 白嫖金额）
│   │   ├── report-form.tsx    # 举报表单（Portal 渲染）
│   │   ├── detail-modal.tsx   # 详情弹窗
│   │   └── admin-panel.tsx    # 管理面板
│   ├── lib/
│   │   ├── supabase.ts        # Supabase客户端
│   │   └── utils.ts           # 工具函数
│   └── types/
│       └── index.ts           # 类型定义
├── schema.sql                 # 数据库初始化 SQL
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📄 License

MIT
