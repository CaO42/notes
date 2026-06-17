## 高级数据

## 缓冲区

我们先回顾一下缓冲区

```c++
unsigned int VAO;
glGenVertexArrays(1, &VAO);
glBindVertexArray(VAO);

unsigned int VBO;//创建缓冲区对象并获取id
glGenBuffers(1, &VBO);//创建缓冲区 此时的缓冲只是一个管理特定内存块的对象，没有其它更多的功能
glBindBuffer(GL_ARRAY_BUFFER, VBO);//将创建的VBO绑定至GL_ARRAY_BUFFER缓冲目标
//在OpenGL的状态机中有很多不同的缓冲目标，每个缓冲目标同时只绑定一个缓冲区
glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);//将数据填充到该缓冲目标此时绑定的缓冲区中 STATIC为不需要更改数据的模式
```

我们调用glBufferData函数来填充缓冲对象所管理的内存，这个函数会分配一块GPU内存，并将数据添加到这块内存中。如果我们将它的`data`参数设置为`NULL`，那么这个函数将只会分配内存，但不进行填充。

在OpenGL中还有其他方式可以进行缓冲区数据的修改

### glBufferSubData函数

```c++
//该函数从offset值开始向缓冲区内填充数据
//使用前需要缓冲区内已经有对应内存分配 因此需要先调用glBufferData
glBufferSubData(GL_ARRAY_BUFFER, 24, sizeof(data), &data); 
// 范围： [24, 24 + sizeof(data)]
```

### 直接写入缓存内存

```c++
float data[] = {
  0.5f, 1.0f, -0.35f
  ...
};
glBindBuffer(GL_ARRAY_BUFFER, buffer);
// 获取指针
void *ptr = glMapBuffer(GL_ARRAY_BUFFER, GL_WRITE_ONLY);
// 复制数据到内存
memcpy(ptr, data, sizeof(data));
// 告诉OpenGL我们不再需要这个指针了
glUnmapBuffer(GL_ARRAY_BUFFER);
```

## 分批顶点属性

我们此前通过如下方式指定VAO的顶点属性布局

```c++
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);

glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);

glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));
glEnableVertexAttribArray(2);
```

这是因为我们对属性进行了交错(Interleave)处理，在data数组中，顶点的位置、法线和/或纹理坐标紧密放置在一起。

但当我们从文件中加载顶点数据的时候，通常获取到的是一个位置数组、一个法线数组和/或一个纹理坐标数组。

```c++
float positions[] = { ... };
float normals[] = { ... };
float tex[] = { ... };
```

为了更加简单便捷，并且易于扩展，我们可以将每一种属性类型的向量数据**打包(Batch)**为一个大的区块，而不是对它们进行交错储存。与交错布局123123123123不同，我们将采用**分批(Batched)**的方式111122223333。

```c++
// 填充缓冲
glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(positions), &positions);
glBufferSubData(GL_ARRAY_BUFFER, sizeof(positions), sizeof(normals), &normals);
glBufferSubData(GL_ARRAY_BUFFER, sizeof(positions) + sizeof(normals), sizeof(tex), &tex);

//顶点属性的偏移和步长需要调整
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), 0);  
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)(sizeof(positions)));  
glVertexAttribPointer(
  2, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)(sizeof(positions) + sizeof(normals)));
```

## 复制缓冲

**glCopyBufferSubData**能够让我们相对容易地从一个缓冲中复制数据到另一个缓冲中，原型如下：

```c++
void glCopyBufferSubData(GLenum readtarget, GLenum writetarget, GLintptr readoffset, GLintptr writeoffset, GLsizeiptr size);
```

但我们无法通过这个函数复制两个相同类型的缓冲区，因为同一个缓冲目标只能同时绑定其中一个缓冲区。

出于这个原因，OpenGL提供给我们另外两个缓冲目标，叫做**GL_COPY_READ_BUFFER**和**GL_COPY_WRITE_BUFFER**。我们接下来就可以将需要的缓冲绑定到这两个缓冲目标上，并将这两个目标作为`readtarget`和`writetarget`参数。

```
glBindBuffer(GL_COPY_READ_BUFFER, vbo1);
glBindBuffer(GL_COPY_WRITE_BUFFER, vbo2);
glCopyBufferSubData(GL_COPY_READ_BUFFER, GL_COPY_WRITE_BUFFER, 0, 0, sizeof(vertexData));
```

## 高级glsl

## glsl内建变量

除了我们已经使用过的顶点属性和uniform之外，GLSL还定义了另外几个以**`gl_`**为前缀的变量。我们已经接触过其中的两个了：顶点着色器的输出向量**gl_Position**，和片段着色器的**gl_FragCoord**。

### 顶点着色器

#### gl_Position

我们已经使用过很多次，它是顶点着色器的**裁剪空间输出**位置向量(vec4)。顶点着色器必须为其赋值才能正常工作。

```c++
gl_Position = projection * view * model * vec4(aPos.xyz,  1.0);
```

#### gl_PointSize

glDrawArrays函数可以选用的其中一个图元是**GL_POINTS**，如果使用它的话，每一个顶点都是一个图元，都会被渲染为一个点。

GLSL定义了一个叫做gl_PointSize**输出变量**，它是一个**float**变量，你可以使用它来设置点的宽高（像素）

```c++
//修改点的尺寸默认关闭 需要手动开启
glEnable(GL_PROGRAM_POINT_SIZE);

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0);    
    gl_PointSize = gl_Position.z;    
}
```

#### gl_VertexID

gl_VertexID是一个**输入变量**，我们只能对它进行读取。

**整型**变量gl_VertexID储存了正在绘制顶点的当前ID。当（使用glDrawElements）进行**索引**渲染的时候，这个变量会存储正在绘制顶点的**当前索引**。当（使用glDrawArrays）**不使用索引**进行绘制的时候，这个变量会储存从渲染调用开始的**已处理顶点数量**。

### 片段着色器

#### gl_FragCoord

gl_FragCoord的**z分量**等于对应片段的**深度值**。

gl_FragCoord的**x和y分量**是片段的**窗口空间(Window-space)坐标**，其原点为窗口的左下角。我们已经使用glViewport设定了一个800x600的窗口了，所以片段窗口空间坐标的x分量将在0到800之间，y分量在0到600之间。

通过利用片段着色器，我们可以根据片段的窗口坐标，计算出不同的颜色。

#### gl_FrontFacing

在面剔除教程中，我们提到OpenGL能够根据顶点的环绕顺序来决定一个面是正向还是背向面。如果我们**不（启用GL_FACE_CULL**来）使用面剔除，那么gl_FrontFacing将会告诉我们当前片段是**属于正向面的一部分还是背向面的一部分**。举例来说，我们能够对正向面计算出不同的颜色。

gl_FrontFacing变量是一个**bool**，如果当前片段是**正向**面的一部分那么就是**true**，否则就是`false`。比如说，我们可以这样子创建一个立方体，在内部和外部使用不同的纹理：

```c++
#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D frontTexture;
uniform sampler2D backTexture;

void main()
{             
    if(gl_FrontFacing)
        FragColor = texture(frontTexture, TexCoords);
    else
        FragColor = texture(backTexture, TexCoords);
}
```

如果我们往箱子里面看，就能看到使用的是不同的纹理。

#### gl_FragDepth

输入变量**gl_FragCoor**d能让我们读取当前片段的窗口空间坐标，并获取它的深度值，但是它是一个**只读**(Read-only)变量。我们不能修改片段的窗口空间坐标，但实际上修改片段的深度值还是可能的。GLSL提供给我们一个叫做**gl_FragDepth**的**输出变量**，我们可以使用它来在着色器内**设置片段的深度值**。

要想设置深度值，我们直接写入一个0.0到1.0之间的float值到输出变量就可以了：

```c++
gl_FragDepth = 0.0; // 这个片段现在的深度值为 0.0
```

如果着色器没有写入值到gl_FragDepth，它会自动取用`gl_FragCoord.z`的值。

然而，由我们自己设置深度值有一个很大的缺点，只要我们在片段着色器中对gl_FragDepth进行写入，OpenGL就会禁用所有的提前深度测试(Early Depth Testing)。它被禁用的原因是，OpenGL无法在片段着色器运行**之前**得知片段将拥有的深度值，因为片段着色器可能会完全修改这个深度值。

在写入gl_FragDepth时，你就需要考虑到它所带来的性能影响。然而，从OpenGL 4.2起，我们仍可以对两者进行一定的调和，在片段着色器的顶部使用深度条件(Depth Condition)重新声明gl_FragDepth变量：

```c++
layout (depth_<condition>) out float gl_FragDepth;
```

`condition`可以为下面的值：

| 条件        | 描述                                                         |
| :---------- | :----------------------------------------------------------- |
| `any`       | 默认值。提前深度测试是禁用的，你会损失很多性能               |
| `greater`   | 你只能让深度值比`gl_FragCoord.z`更大                         |
| `less`      | 你只能让深度值比`gl_FragCoord.z`更小                         |
| `unchanged` | 如果你要写入`gl_FragDepth`，你将只能写入`gl_FragCoord.z`的值 |

通过将深度条件设置为`greater`或者`less`，OpenGL就能假设你只会写入比当前片段深度值更大或者更小的值了。这样子的话，当深度值比片段的深度值要小的时候，OpenGL仍是能够进行提前深度测试的。

下面这个例子中，我们对片段的深度值进行了递增，但仍然也保留了一些提前深度测试：

```c++
#version 420 core // 注意GLSL的版本！
out vec4 FragColor;
layout (depth_greater) out float gl_FragDepth;

void main()
{             
    FragColor = vec4(1.0);
    gl_FragDepth = gl_FragCoord.z + 0.1;
}  
```

注意这个特性只在OpenGL 4.2版本或以上才提供。

## Unifrom缓冲

## //TODO
