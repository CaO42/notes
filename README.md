# 个人笔记网站

基于 **MkDocs Material** 的极简现代风格笔记网站，部署在 GitHub Pages。push 新笔记后自动构建并即时更新。

## ✨ 特性

- 📝 完整支持 Markdown 与 LaTeX 数学公式（行内 `$...$` / 块级 `$$...$$`）
- 📂 **自动识别目录结构**生成左侧导航，无需手动维护
- 🌗 自适应系统深浅色 + 手动切换按钮
- 🔍 内置全文搜索
- 📑 页面标题树（TOC）集成在左侧导航，长文跳转方便
- 📱 **移动端专项优化**（字号、间距、导航抽屉、表格滚动）
- ⚡ push 即自动部署（GitHub Actions）

## 📁 项目结构

```
.
├── docs/                       # 笔记源文件（放这里即可自动上线）
│   ├── index.md                # 首页
│   ├── javascripts/
│   │   └── mathjax.js          # MathJax 配置
│   ├── stylesheets/
│   │   └── extra.css           # 极简风格 + 移动端优化
│   ├── 数学/
│   │   ├── .pages              # 目录标题与排序（可选）
│   │   └── 微积分基础.md
│   └── 编程/
│       ├── .pages
│       └── python笔记.md
├── .github/workflows/
│   └── ci.yml                  # 自动构建部署工作流
├── mkdocs.yml                  # 站点配置
├── requirements.txt            # Python 依赖
└── README.md
```

## 🚀 首次部署（5 步）

### 第 1 步：替换占位符

在 `mkdocs.yml` 中将 `<USERNAME>` 和 `<REPO>` 替换为你的 GitHub 用户名和仓库名（共 3 处：`site_url`、`repo_url`、`repo_name`，以及 `extra.social` 中的 1 处）。

```yaml
site_url: https://yourname.github.io/notes/
repo_url: https://github.com/yourname/notes
repo_name: yourname/notes
```

### 第 2 步：在 GitHub 创建仓库

新建一个公开仓库（如 `notes`），不要勾选初始化 README。

### 第 3 步：推送代码

```bash
cd C:\Users\YHG\ZCodeProject
git init
git add .
git commit -m "初始化笔记网站"
git branch -M main
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```

### 第 4 步：开启 GitHub Pages

进入仓库 **Settings → Pages → Build and deployment**，将 **Source** 设置为 **GitHub Actions**（不是 Deploy from a branch）。

### 第 5 步：等待部署完成

推送后会自动触发 Actions（在仓库 **Actions** 标签页可查看进度），约 1-2 分钟后访问：

```
https://<USERNAME>.github.io/<REPO>/
```

## ✍️ 日常使用：新增笔记

只需在 `docs/` 下创建 `.md` 文件并 push，网站会自动更新：

```bash
# 例如新增一篇算法笔记
echo "# 排序算法" > docs/编程/排序算法.md
git add .
git commit -m "新增排序算法笔记"
git push
```

文件夹与文件会**自动出现在左侧导航**。

### 自定义目录标题或排序（可选）

在任意文件夹下创建 `.pages` 文件：

```yaml
title: 我的分类名          # 覆盖文件夹名作为导航标题
nav:
  - 排序算法.md            # 固定某文件排第一
  - ...                    # 其余按默认顺序
```

## 💻 本地预览

```bash
pip install -r requirements.txt
mkdocs serve
```

浏览器打开 `http://127.0.0.1:8000`，修改文件会实时热更新。

## ➕ 写数学公式

行内公式用 `$...$`，块级公式用 `$$...$$`：

```markdown
当 $a \ne 0$ 时，方程 $ax^2 + bx + c = 0$ 的解为：

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

支持 `align`、`cases`、`pmatrix` 等常见环境，详见 `docs/数学/微积分基础.md`。
