# Python 笔记

本篇用于验证普通 Markdown 排版（代码、列表、提示框等）的渲染效果。

## 基础语法

### 变量与类型

Python 是动态类型语言，变量无需声明类型：

```python
name = "Alice"      # str
age = 30            # int
height = 1.65       # float
is_student = True   # bool
```

### 列表推导式

```python
# 生成 0-9 的平方数列
squares = [x ** 2 for x in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# 带条件的列表推导式
even_squares = [x ** 2 for x in range(10) if x % 2 == 0]
print(even_squares)  # [0, 4, 16, 36, 64]
```

## 常用数据结构

- **列表** `list`：有序、可变
- **元组** `tuple`：有序、不可变
- **字典** `dict`：键值对、可变
- **集合** `set`：无序、元素唯一

!!! tip "提示"
    字典在 Python 3.7+ 中保持插入顺序，可安全依赖此特性。

## 函数与装饰器

```python
def memoize(func):
    """简单的记忆化装饰器"""
    cache = {}

    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    return wrapper

@memoize
def fib(n):
    """斐波那契数列"""
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(50))  # 12586269025
```

## 任务清单示例

- [x] 学习基础语法
- [x] 掌握数据结构
- [ ] 理解装饰器原理
- [ ] 熟悉异步编程

---

> 代码块右上角提供复制按钮，移动端可横向滚动查看长代码。
