# 个人笔记网站

基于 MkDocs Material 的个人笔记站，部署在 GitHub Pages。push 后自动构建更新。

- 站点地址：https://cao42.github.io/notes/
- 仓库地址：https://github.com/CaO42/notes

## 技术栈

- 静态站点生成：MkDocs + Material 主题
- 数学公式：MathJax 3（行内 `$...$`，块级 `$$...$$`，支持 align/cases/pmatrix 等环境）
- 导航：awesome-pages 插件，自动识别目录结构，通过 `.pages` 文件控制标题和排序
- 部署：GitHub Actions 自动构建，push 到 main 分支即触发

## 目录结构

```
docs/
├── index.md                          # 首页
├── javascripts/mathjax.js            # MathJax 配置
├── stylesheets/extra.css             # 自定义样式（极简风格 + 移动端优化）
├── 人工智能/
│   ├── .pages                        # 导航分组：搜索技术 / 概率推理 / 机器学习 / 深度学习
│   ├── 00_总览与复习路线.md
│   ├── 01 ~ 11                       # 12 篇课程笔记，按编号顺序排列
│   └── ...
└── 图形学/
    ├── .pages                        # 导航排序：FCG_games101 > LearnOpenGL > Unity > 探究
    ├── FCG_games101/                 # 光栅化、Blinn-Phong、PBR 等
    ├── LearnOpenGL/
    │   ├── 基础/                     # 开始、VAO/VBO/EBO
    │   ├── 光照/                     # 光照模型、LookAt
    │   ├── 纹理/                     # 纹理基础（含贴图资源图片）
    │   ├── 高级渲染/                 # 帧缓冲、深度/模板测试、混合、抗锯齿、HDR、阴影、延迟着色等
    │   └── 着色器进阶/               # 几何着色器、实例化、法线贴图、立方体贴图等
    ├── Unity/                        # Unity Shader
    └── 探究/                         # NeRF、后处理、小孔成像等专题
└── 操作系统/
    ├── .pages                        # 导航分组：Lab5 > Lab6
    ├── lab5/                         # 内核线程、调度切换、优先级调度
    │   ├── Lab5_内核线程.md
    │   └── images/                   # 实验截图
    └── lab6/                         # 自旋锁、信号量、生产者-消费者、读者-写者
        ├── Lab6_并发与锁机制.md
        └── images/                   # 实验截图
```

## 新增笔记

在 `docs/` 下对应分类目录中创建 `.md` 文件，push 即可自动上线。

```bash
# 示例：在人工智能目录新增一篇笔记
echo "# 主题标题" > docs/人工智能/12_新主题.md
git add docs/
git commit -m "新增：人工智能 - 新主题"
git push
```

### 导航控制（.pages 文件）

每个目录下可放置 `.pages` 文件来控制导航显示。格式：

```yaml
title: 显示名称          # 覆盖文件夹名
nav:
  - 文件名.md            # 显式指定排序
  - ...                  # 其余文件按默认顺序
```

### 图片资源

图片放在对应笔记的同级目录下，在 Markdown 中用相对路径引用：

```markdown
![描述](图片名.png)
```

### 新增分类目录

创建新目录后，建议同时添加 `.pages` 文件设置导航标题和排序，并更新 `docs/index.md` 的内容分类说明。

## 本地预览

```bash
pip install -r requirements.txt
mkdocs serve
```

浏览器打开 `http://127.0.0.1:8000`，修改文件会实时热更新。
