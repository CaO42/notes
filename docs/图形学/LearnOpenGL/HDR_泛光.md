### 颜色

在进入HDR之前，我们先来再次理解一下计算机中的颜色。

我们常用的RGB颜色是一个三元向量，它的分量r、g、b分别代表着这个像素的红绿蓝三种光的强度。当一个分量比如r为1时，代表这个像素会发出我们规定的最高亮度的红光；而当r分量为0时，代表着这个像素不发出红光。rgb三色光进行组合产生了我们需要的颜色。

现代的软件和硬件厂商一起制定了一些颜色标准，用于规定显示设备的效果。这使得我们可以保证相同格式相同内容的图片能在显示器上呈现相同的效果。

sRGB是其中最常用的标准（sRGB见gamma校正）。

我们可以看到CIE色度图中，sRGB的三原色围成了一个三角形。这个三角形内的颜色，就是我们可以采用此标准表示的颜色。

如果我们想要得到某个点P的颜色，我们可以采用重心坐标的方式，P=αA+βB+γC，α+β+γ=1，计算出该点的重心坐标。实际上，这个重心坐标是三个原色点的一个线性组合。

但是我们会发现，这与我们使用的rgb颜色并不相同，我们的rgb变量之间并没有和为1的限制。

这是为什么呢？因为色度图实际上考虑的只有颜色本身，CIE xy 色度图**完全剥离了亮度信息**，只保留了色相和饱和度。而rgb颜色本身代表的是每个分量的亮度，它同时带有颜色和亮度的信息。

实际上，在rgb三个分量的比值相同的情况下，表示的是色度图上的同一个点，也就是同一个颜色，但是亮度不同。

### HDR

现在我们回到普通的光照计算里面，不再考虑色彩协议之类的问题。

这是因为我们图形学的计算都在线性颜色空间中，只要输入的颜色数据是处于线性空间中的，我们计算的结果就是正确。（比如sRGB需要通过传递函数转换为线性颜色空间的值才能进行计算）

但还有一个问题，我们在正常光照计算的叠加后，经常会出现rgb超出1.0的部分。从结果来说，这说明这个变量的光超过了显示器（或色彩协议）能够显示的最亮颜色。

我们不可能解决硬件的限制，通常我们会采用直接clamp的方式将其截断，超出1.0的部分都为1.0。

但是物理意义上，这个像素显示的光应该是那个原始的数据，而不是截断后的颜色，这导致了颜色信息的丢失。最常见的情况是，高亮度场景下大量出现1.0的光，导致细节缺失。

一种解决方案是，我们调整系统中光源的光照强度，让场景中尽量不出现超过1.0光强度像素。

这种方案并不好，因为我们强行改变的光照强度可能并不符合我们本来的物理定义，会产生错误的计算结果。

我们有更合理的解决方案。

#### HDR的实现思路是：

虽然我们不能突破显示器的显示，但是我们希望保留更多细节。

我们在光照计算时，不再进行clamp操作。正常计算所有光照，使rgb的值可以超过1。

为了能够正常显示，我们保留最重要的场景细节——对比度。通过一定的算法，将HDR的色彩缩放回能正常显示的0到1中。

虽然使得原先在[0.0, 1.0]范围内的颜色也被迫改变，但是由于保留了几乎所有的对比度细节，能够呈现更好的显示效果。

颜色空间超过[0.0, 1.0]^3后，我们将其称为**HDR(High Dynamic Range, 高动态范围)**。原先的颜色空间被称为LDR(Low Dynamic Range,低动态范围)。

转换HDR值到LDR值得过程叫做**色调映射(Tone Mapping)**。我们可以看出，HDR的重点在于选择合适的色调映射方法。

#### 离屏渲染

为了实现HDR，我们需要进行离屏渲染。

我们可能会想，为什么不直接在片段着色器的最后进行色调映射的操作，省去离屏渲染的操作？

这有多个方面的原因：

##### 后处理

各种常见的后处理操作（比如高斯模糊），都需要在线性的色彩空间中进行计算。

这是由于我们不知道使用的色调映射的操作是否会对后处理产生影响。

以高斯模糊为例，它是一个卷积操作，对一定范围内的片段按权重累加求值。当色调映射不是线性映射时（比如最常见的Reinhard色调映射），先进行色调映射再进行卷积会改变结果，产生错误的显示效果。

##### 混合

这个问题的成因和后处理相同。关键都在于色调映射通常不是线性映射。

Alpha Blending的操作本质也是一个加权求和的操作。

对于$f(x) = \frac{x}{x+1}$的非线性色调映射，我们知道其加法也不满足线性关系$$ ToneMap(A) + ToneMap(B) \neq ToneMap(A + B) $$ 

如果我们直接在片段着色器中进行色调映射，相当于在混合之前进行了非线性的变换，会产生错误的结果。

##### 延迟渲染

在现代游戏引擎的框架中，常采用延迟渲染。延迟渲染的基础片段着色器阶段，并不进行光照计算，只是将片段和所需数据存入G-Buffer。不需要进行色调映射。

#### 浮点帧缓冲

为了存储一个HDR的颜色值，我们需要在帧缓冲的颜色插件上，应用一个采用浮点值存储的纹理。

```c++
glBindTexture(GL_TEXTURE_2D, colorBuffer);
// GL_RGB16F表示采用16位浮点数存储每一个分量 也即float存储
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB16F, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGB, GL_FLOAT, NULL); 
```

当一个帧缓冲的颜色缓冲的内部格式被设定成了`GL_RGB16F`, `GL_RGBA16F`, `GL_RGB32F` 或者`GL_RGBA32F`时，这些帧缓冲被叫做浮点帧缓冲(Floating Point Framebuffer)，浮点帧缓冲可以存储超过0.0到1.0范围的浮点值，所以非常适合HDR渲染。

接下来，我们先渲染一个光照的场景到浮点帧缓冲中，之后再在一个铺屏四边形(Screen-filling Quad)上应用这个帧缓冲的颜色缓冲：

```c++
glBindFramebuffer(GL_FRAMEBUFFER, hdrFBO);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);  
    // [...] 渲染(光照的)场景
glBindFramebuffer(GL_FRAMEBUFFER, 0);

// 现在使用一个不同的着色器将HDR颜色缓冲渲染至2D铺屏四边形上
hdrShader.Use();
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, hdrColorBufferTexture);
RenderQuad();
```

我们只需要在铺屏四边形的着色器里实现色调映射操作就可以实现HDR到LDR到转换。

#### 色调映射

##### Reinhard色调映射

最简单的色调映射算法是Reinhard色调映射，其公式为$f(x) = \frac{x}{x+1}$。

Reinhard色调映射算法平均地将所有亮度值分散到LDR上。

我们将Reinhard色调映射应用到之前的片段着色器上，并且为了更好的测量加上一个Gamma校正过滤(包括SRGB纹理的使用)：

```c++
void main()
{             
    const float gamma = 2.2;
    vec3 hdrColor = texture(hdrBuffer, TexCoords).rgb;

    // Reinhard色调映射
    vec3 mapped = hdrColor / (hdrColor + vec3(1.0));
    // Gamma校正 这里是简单的gamma校正，sRGB的会更复杂一些
    mapped = pow(mapped, vec3(1.0 / gamma));

    color = vec4(mapped, 1.0);
}   
```

这个算法是倾向明亮的区域的，暗的区域会不那么精细也不那么有区分度。

这是由于这个算法将1.0映射到了0.5（1/1+1）。这使得正常的，符合人眼舒适范围的[0.0, 1.0]范围的颜色只占据了50%的显示范围。而剩下的50%都留给了显示高亮的区域。

##### 曝光色调映

曝光色调映射的核心思想是**模拟真实世界中相机胶片或传感器对光的感应过程**。在物理世界中，相机感光元件接收光子是一个随时间积累的过程，它符合指数衰减的规律。

其公式如下：$$ L_{out} = 1 - e^{-L_{in} \cdot E} $$

其中E曝光度（Exposure）。这是一个可调节的参数，用来控制整体画面的明暗。

高曝光值会使黑暗部分显示更多的细节，然而低曝光值会显著减少黑暗区域的细节，但允许我们看到更多明亮区域的细节。

通过改变曝光等级，我们可以看见场景的很多细节，而这些细节可能在LDR渲染中都被丢失了。

### 泛光

泛光模拟的是现实世界中，**人眼或摄像机镜头在观察极其明亮的光源时产生的光学散射现象。**

在现实中，当光线非常强烈，超过了视网膜或相机传感器的动态捕捉范围时，光线会在眼球内部（或相机镜头/玻璃镜片之间）发生散射和折射。

这种物理现象导致的结果是：我们看到的高光区域会“溢出”到周围较暗的区域，形成一圈朦胧的**光晕**。泛光特效就是为了在数字图像中还原这种“亮到刺眼”的视觉感受。

泛光实际上是一种后处理技术（比如最常用的高斯模糊是一种卷积），在不采用HDR技术时也可以实现。但是使用HDR时实现更加容易，并且HDR常见天然会出现我们需要的极其明亮的光源（超出LDR范围），所以我们通常在使用HDR的前提下进行泛光处理。

在HDR中，泛光的思路很简单：

对于渲染出的颜色缓冲缓冲，我们提取所有超出一定亮度的fragment（比如亮度超过1.0）放入一张新的纹理。然后我们对这张包含高亮度部分的纹理进行卷积操作，产生模糊的光晕效果。最后将两张纹理混合。

#### 提取亮色

为了便于提取亮色，我们可以使用一种叫做MRT（Multiple Render Targets，多渲染目标）的技术。

正如它的名字，我们可以将一个片段输出到两个（或多个）颜色缓冲里。

```c++
// 原先我们的out变量只有一个 不需要layout标注属性位置
// 但是现在我们需要进行标注
layout (location = 0) out vec4 FragColor;
layout (location = 1) out vec4 BrightColor;
```

使用多个像素着色器输出的必要条件是，有多个颜色缓冲附加到了当前绑定的帧缓冲对象上。我们需要给当前的帧缓冲挂载对应数量的颜色缓冲插件。

```c++
// 帧缓冲初始化
GLuint hdrFBO;
glGenFramebuffers(1, &hdrFBO);
glBindFramebuffer(GL_FRAMEBUFFER, hdrFBO);
// 我们需要两个颜色缓冲
GLuint colorBuffers[2];
glGenTextures(2, colorBuffers);
for (GLuint i = 0; i < 2; i++)
{
    glBindTexture(GL_TEXTURE_2D, colorBuffers[i]);
    glTexImage2D(
        GL_TEXTURE_2D, 0, GL_RGB16F, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGB, GL_FLOAT, NULL
    );
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    // 绑定到对应的纹理缓冲位置
    glFramebufferTexture2D(
        GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0 + i, GL_TEXTURE_2D, colorBuffers[i], 0
    );
}


GLuint attachments[2] = { GL_COLOR_ATTACHMENT0, GL_COLOR_ATTACHMENT1 };
// 我们需要用这个函数显式告知OpenGL我们目前采用的渲染目标数量 以及渲染目标的索引
glDrawBuffers(2, attachments);
```

在片段着色器，我们只需要加入条件来判断是否将片段加入高亮的纹理：

```c++
#version 330 core
layout (location = 0) out vec4 FragColor;
layout (location = 1) out vec4 BrightColor;

[...]

void main()
{            
    [...] // 光照计算
    FragColor = vec4(lighting, 1.0f);
    // 计算亮度 这是标准的相对亮度公式
    float brightness = dot(FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  	// 亮度超过1.0则加入高亮纹理
  	// 这里直接截取的方法被称为硬阈值（Hard Threshold）可能会导致生硬的截断边缘
  	// 我们可以以后引入软阈值算法解决 现在先使用这个简易的实现
    if(brightness > 1.0)
        BrightColor = vec4(FragColor.rgb, 1.0);
}
```

#### 高斯模糊

高斯分布，也就是正态分布，是统计学中最常见的分布。

![img](https://learnopengl-cn.github.io/img/05/07/bloom_gaussian.png)

高斯模糊是对二维正态分布的一个离散的近似，使用它来产生进行泛光处理可以得到很多好处。

其中最重要的一个好处是，正态分布具有**线性可分离性（Separability）**，可以极大的减少计算消耗。

这是由于：

$$G(x, y) = \frac{1}{2\pi\sigma^2} e^{-\frac{x^2 + y^2}{2\sigma^2}}$$  得 $$G(x, y) = \left( \frac{1}{\sqrt{2\pi}\sigma} e^{-\frac{x^2}{2\sigma^2}} \right) \cdot \left( \frac{1}{\sqrt{2\pi}\sigma} e^{-\frac{y^2}{2\sigma^2}} \right) = G(x) \cdot G(y)$$

![img](https://learnopengl-cn.github.io/img/05/07/bloom_gaussian_two_pass.png)

这代表着对于边长为N的高斯模糊卷积核，我们只需要进行$\mathcal{O}(2N)$次纹理采样，而不是原先的$\mathcal{O}(N^2)$次。这可以极大的减少计算量。

另一个好处是，二维正态分布中公式中自变量是以 $x^2 + y^2$（即半径的平方 $r^2$）出现的，高斯函数在各个方向上的权重分布是完全一致的。

虽然我们采用的是方形的卷积核，高斯模糊无论光源形状如何，依然能保证光晕向外是以完美的圆形扩散的，这符合光学规律。能够呈现比较好的显示效果。

我们先来看高斯模糊片段着色器的实现。

```c++
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D image;

uniform bool horizontal;

// 这是一维正态分布的近似 我们这里采用9*9卷积核
// 由于正态分布的对称性 我们只需要给出一半权重
uniform float weight[5] = float[] (0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);

void main()
{             
    vec2 tex_offset = 1.0 / textureSize(image, 0); // 获取纹素的大小
    vec3 result = texture(image, TexCoords).rgb * weight[0]; // 计算当前（中心）纹素的贡献
    if(horizontal)
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture(image, TexCoords + vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
            result += texture(image, TexCoords - vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
        }
    }
    else
    {
        for(int i = 1; i < 5; ++i)
        {
            result += texture(image, TexCoords + vec2(0.0, tex_offset.y * i)).rgb * weight[i];
            result += texture(image, TexCoords - vec2(0.0, tex_offset.y * i)).rgb * weight[i];
        }
    }
    FragColor = vec4(result, 1.0);
}
```

可以发现我们采用了horizontal来控制着色的工作，而且我们一次着色器只进行了一个水平/垂直的高斯卷积处理。这看起来可能有点困惑，和之前的推导不同，我们之后来讨论。

```c++
// 我们需要创建两个缓冲区作为Ping-Pong Buffers
// 这是由于在图形学中，我们不能在同一个 Pass 中同时对同一个纹理进行读取和写入
GLuint pingpongFBO[2];
GLuint pingpongBuffer[2];
glGenFramebuffers(2, pingpongFBO);
glGenTextures(2, pingpongBuffer);
for (GLuint i = 0; i < 2; i++)
{
    glBindFramebuffer(GL_FRAMEBUFFER, pingpongFBO[i]);
    glBindTexture(GL_TEXTURE_2D, pingpongBuffer[i]);
    glTexImage2D(
        GL_TEXTURE_2D, 0, GL_RGB16F, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGB, GL_FLOAT, NULL
    );
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glFramebufferTexture2D(
        GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, pingpongBuffer[i], 0
    );
}

GLboolean horizontal = true, first_iteration = true;
GLuint amount = 10; // 这里的10代表进行了 10/2=5次高斯模糊
shaderBlur.Use();
for (GLuint i = 0; i < amount; i++)
{
    glBindFramebuffer(GL_FRAMEBUFFER, pingpongFBO[horizontal]); 
    glUniform1i(glGetUniformLocation(shaderBlur.Program, "horizontal"), horizontal);
  	// 第一次使用先前渲染的颜色纹理 后面在ping-pong buffer中来回应用
    glBindTexture(
        GL_TEXTURE_2D, first_iteration ? colorBuffers[1] : pingpongBuffers[!horizontal]
    ); 
    RenderQuad();
    horizontal = !horizontal;
    if (first_iteration)
        first_iteration = false;
}
glBindFramebuffer(GL_FRAMEBUFFER, 0);
```

可以看出，当我们先采用一次水平卷积，再采用一次垂直卷积时，就完成了一次高斯模糊。这是什么原理呢？我们进行一些数学上的推导。

> 在片段着色器中，我们要计算当前像素 $(x, y)$ 经过 $N \times N$ 高斯模糊后的最终颜色值 $C(x, y)$。假设高斯核的半径为 $k$（即 $N = 2k + 1$）。
>
> 按照最基础的定义，我们需要进行双重循环：
>
> $$C(x, y) = \sum_{j=-k}^{k} \sum_{i=-k}^{k} \text{Image}(x+i, y+j) \cdot G_{2D}(i, j)$$
>
> 因为二维高斯函数具有可分离性，它的二维权重等于两个一维权重的乘积：
>
> $$G_{2D}(i, j) = G_{1D}(i) \cdot G_{1D}(j)$$
>
> 我们将这个等式代入上面的双重循环中：
>
> $$C(x, y) = \sum_{j=-k}^{k} \sum_{i=-k}^{k} \text{Image}(x+i, y+j) \cdot G_{1D}(i) \cdot G_{1D}(j)$$
>
> 我们对式子进行一些变形：
>
> $$C(x, y) = \sum_{j=-k}^{k} G_{1D}(j) \left[ \sum_{i=-k}^{k} \text{Image}(x+i, y+j) \cdot G_{1D}(i) \right]$$
>
> 方括号中的式子看起来有些熟悉，实际上它就是我们刚刚着色器中的算法：
>
> ```c++
> for(int i = 1; i < 5; ++i)
>         {
>             result += texture(image, TexCoords + vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
>             result += texture(image, TexCoords - vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
>         }
> ```
>
> 当你渲染完水平 Pass 后，乒乓缓冲里的那个临时纹理，它上面的每一个像素值，**正好就是括号里计算出的结果**。我们不妨把这个临时纹理叫做 $\text{Temp}(x, y)$。
>
> 于是公式就变成了：
>
> $$C(x, y) = \sum_{j=-k}^{k} G_{1D}(j) \cdot \text{Temp}(x, y+j)$$
>
> 实际上，这就是下一次 `horizontal = false` 时的那次垂直 Pass 。
>
> 也就是说，经过一横一竖两次 $\mathcal{O}(N)$ 的累加，最终我们得到的结果在数学上与直接进行 $\mathcal{O}(N^2)$ 的矩阵累加**绝对相等**的答案。
>
> 我们采用一种十分优雅而简洁的代码实现了高斯模糊。

#### 混合纹理

最后，我们得到了对高亮部分进行高斯模糊后的纹理。是时候把它和完成的场景纹理混合了。

```c++
#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D scene;
uniform sampler2D bloomBlur;
uniform float exposure;

void main()
{             
    const float gamma = 2.2;
    vec3 hdrColor = texture(scene, TexCoords).rgb;      
    vec3 bloomColor = texture(bloomBlur, TexCoords).rgb;
    hdrColor += bloomColor; // 加法混合
    // 色调映射
    vec3 result = vec3(1.0) - exp(-hdrColor * exposure);
    // gamma校正 
    result = pow(result, vec3(1.0 / gamma));
    FragColor = vec4(result, 1.0f);
}
```

### 完整的渲染管线

我们可以概括一下采用了HDR和泛光技术后的完整**渲染管线顺序**。

渲染HDR场景 -> 提取高光纹理 -> 对高光纹理进行模糊 -> **将模糊后的泛光纹理与原HDR场景纹理进行加法混合（Additive Blending）** -> **对混合后的最终 HDR 结果进行 Tone Mapping** -> Gamma校正 -> 屏幕输出。

### 进阶问题 - 待完善

ACES色调映射

提取高亮的软阈值算法

降采样泛光
