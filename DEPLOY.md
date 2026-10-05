# 🚀 部署到 Netlify · 傻瓜教程

站点：**mellow-zuccutto-bfd96d**
目标：网站上线 + 留言板可用（用 Netlify 自带的 Blobs 存储，免费、永久、无需注册别的服务）

---

## ⚠️ 重要：先看这里

**普通"拖拽上传"不能让留言板工作**（拖拽只传静态文件，不跑后端）。
留言板要工作，必须让 Netlify **跑 Functions**。有两种方式：

| 方式 | 难度 | 留言板 | 推荐 |
|---|---|---|---|
| **方式一：连接 GitHub** | 简单 | ✅ 可用 | ⭐ 推荐 |
| **方式二：Netlify CLI** | 中等 | ✅ 可用 | 备选 |
| 方式三：纯拖拽 | 最简单 | ❌ 不可用 | 只看效果 |

**推荐方式一**，跟着做就行。

---

## 方式一：连接 GitHub 部署（推荐，10 分钟）

### 第 1 步：把项目推上 GitHub

1. 打开 https://github.com/new 建一个新仓库（比如 `forest-site`），**私有或公开都行**
2. 建好后，在项目文件夹里执行（把 `你的用户名/forest-site` 换成实际地址）：

```bash
cd C:\Users\茶\.openclaw\workspace\forest-site
git init
git add .
git commit -m "init: 森林的奥妙"
git branch -M main
git remote add origin https://github.com/你的用户名/forest-site.git
git push -u origin main
```

### 第 2 步：在 Netlify 关联网站

1. 打开你的站点：https://app.netlify.com/projects/mellow-zuccutto-bfd96d
2. 左侧菜单 **Site configuration → Build & deploy → Link repository**
3. 选 **GitHub** → 授权 → 选上面的 `forest-site` 仓库
4. 构建设置（Netlify 通常自动识别 `netlify.toml`，不用改）：
   - **Build command**：留空
   - **Publish directory**：`.`（根目录）
5. 点 **Deploy**

### 第 3 步：启用 Blobs（留言存储）

Netlify **部署时会自动创建 Blobs**，通常不用手动操作。
若留言报错，去 **Site configuration → Functions** 确认 Functions 已启用。

---

## 方式二：Netlify CLI 部署（不建 GitHub 仓库）

在项目文件夹依次执行：

```bash
cd C:\Users\茶\.openclaw\workspace\forest-site
npm install -g netlify-cli
netlify login
netlify link            # 选择已存在的站点 mellow-zuccutto-bfd96d
netlify deploy --prod
```

---

## 方式三：纯拖拽（留言板不可用）

1. 把网站所有文件打成一个 ZIP
2. 打开 https://app.netlify.com/projects/mellow-zuccutto-bfd96d/deploys
3. 把 ZIP 拖到页面上的 **"Drag and drop your site output folder here"** 区域
4. 完成 ✅（网站能看，但**留言板不工作**）

---

## 部署后验证

1. 打开网站首页 → 各页面正常
2. 进"写给森林的话"页 → 写一条留言 → 发布
3. **刷新页面** → 留言还在 ✅ = 留言板成功
4. 在**手机/另一台电脑**打开同一网址 → 也能看到这条留言 = 真正上线 ✅

---

## 常见问题

**Q: 留言报错 "找不到这个函数"？**
A: 说明 Functions 没部署。检查是否用了方式一/二（GitHub 或 CLI），拖拽不行。

**Q: 数据会丢吗？**
A: Netlify Blobs 是持久存储，正常不会丢。

**Q: 要花钱吗？**
A: 不用。Netlify 免费额度：每月 100GB 流量 + Functions 10 万次 + Blobs 1GB，小网站绰绰有余。
