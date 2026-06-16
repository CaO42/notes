window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
    // 兼容 $...$ 与 $$...$$ 的简化语法
    // (mkdocs-material 官方推荐写法)
  },
  options: {
    ignoreHtmlClass: ".no-mathjax|material-nav|md-search",
    processHtmlClass: "arithmatex"
  },
  // 启用常见的 ams 环境（align, equation, cases 等）
  // 由 MathJax 默认加载的 AMS 扩展提供，无需额外配置
};

// 支持 $...$ 行内、$$...$$ 块级（arithmatex generic 模式下 Markdown 渲染为 \(\) \[\]，
// 这里补充对原始 $/$$ 的容错支持）
window.MathJax.tex.inlineMath = window.MathJax.tex.inlineMath.concat([["$", "$"]]);
window.MathJax.tex.displayMath = window.MathJax.tex.displayMath.concat([["$$", "$$"]]);
