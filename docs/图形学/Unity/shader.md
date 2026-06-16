### 材质与着色器

在unity中，材质与着色器是无法分开使用的。

实际上，unity把着色器看作材质的一部分，每个材质必须指定着色器才能工作。

虽然这与我们OpenGL中可能不同。我们在OpenGL中通常把材质视为一种数据类型，是需要传递给对应片段着色器的属性。

但实际上是一样的，因为我们在使用OpenGL时也存在这样的配对关系。

而且概括为材质的话，更有助于实际的游戏开发者理解。他们不需要知道图形学里的实现原理，他们只需要会使用即可。

unity shader本质上与我们在OpenGL里接触的着色器是一样的。都是图像渲染管线中的一个子程序，接受顶点数据并计算出片段颜色。

着色器并不关心材质上面的具体数据，它只是接受材质提供的数据并以此进行光照计算。

这其实在学习OpenGL的时候自己使用的材质和着色器非常相似，只是进行更高程度的标准化和抽象化。

### ShaderLab

为了更加方便且规范的编写着色器，unity创造了一门标记语言**ShaderLab**。

所有的unity shader都由ShaderLab编写。（实际上核心着色器代码依然采用HLSL等着色器语言，ShaderLab主要用于定义着色器数据结构）

一个unity shader的大致格式如下：

```c#
Shader "Custom/xxShader"
{
    Properties
    {
       	// 属性
    }

    SubShader
    {
        // 实际的着色器
    }
  
  	FallBack "xxShader"
}

```

#### Properties

材质可以传入着色器的数据就通过Properties语义块进行定义。其基础格式如下：

```c#
    Properties
    {
      	// 每一个属性的格式如下
      	// Name ("display name", type) = defaultValue
      	// 其中Name通常以下划线开头 默认值必须符合属性类型
        [MainColor] _BaseColor("Base Color", Color) = (1, 1, 1, 1)
        [MainTexture] _BaseMap("Base Map", 2D) = "white" {}
        _Int ("Int", Int) = 2
        _WaveScale ("Wave scale", Range (0.02,0.15)) = 0.07 // 滑动条
    }

		// [MainColor]是一个类似C#中特性的标签
		// 当我们在游戏的C#脚本中调用material.color时 就会获取材质中被[MainColor]标注的属性
		// [MainTexture]同理 它对应的是material.mainTexture
```

#### SubShader

这是一个shader中最重要的部分。

一个unity shader中可以同时具有多个subshader。Unity 加载这个 Shader 时，会自上而下扫描所有的 `SubShader`。它会找到**当前显卡和渲染管线支持的第一个** `SubShader` 来执行，忽略后面的。如果找不到，unity会使用fallback指定的subshader进行渲染。

subshader的签名如下：

```c#
SubShader
{
    <optional: LOD>
    <optional: tags>
    <optional: commands>
      
    <One or more Pass definitions>
}
```

我们大致可以将其分为两个部分，渲染前的设置和渲染。

LOD我们先不讨论。

命令的作用相当于OpenGL中的上下文，用于设置gpu的状态，是否执行表面剔除，深度测试等选项。

而标签则是用于和unity本身的渲染引擎沟通，告诉引擎我们该怎样，何时渲染物体。在OpenGL中，这部分通常由我们自行实现。

```c#
SubShader
{    
  	//标签的每个设置采用键值对的形式
  	// 这里表示物体不透明 采用URP管线渲染
    Tags { "RenderType" = "Opaque" "RenderPipeline" = "UniversalPipeline" }
  
  
   	Cull Back // 采用背面剔除
    ZTest Less // 采用less函数进行深度测试
      
    // [Pass]
}
```

Pass部分相当于调用Draw Call后的着色器部分。我们可以在一个SubShader中同时有多个不同的Pass，相当于按顺序执行对应次数的Draw Call。

#### Pass

这是unity shader最重要的部分，因为真正的着色器代码逻辑位于此处。它的签名如下：

```C#
Pass
{
    <optional: name>
 		<optional: tags>
    <optional: commands>
   	<optional: shader code>
}
```

Pass中的标签和命令我们之后再来探讨，现在先关注这个name语义。它实际上是出于代码复用的逻辑。

我们可以给一个Pass指定name，当我们需要使用这个Pass的时候，就可以通过UsePass语义直接调用该Pass实现代码复用。

```C#
Pass
{
    Name "myname"
}

// 直接借用标准着色器（Standard）里的阴影投射 Pass
UsePass "Standard/CASTER"
```

另外，我们还有一个GrabPass，它相当于OpenGL中的帧缓冲加上复制缓冲区的操作。它用于把当前屏幕（Frame Buffer）上已经渲染好的图像截取下来，保存到一张纹理（Texture）中。

```c#
GrabPass { "_BackgroundTexture" } // 抓屏并放入_BackgroundTexture纹理中
```

### 数学

unity中的HLSL有一些额外的变量可以使用，它们是由unity提供的，能够便捷的编写着色器程序。

可以参考https://docs.unity3d.com/cn/current/Manual/SL-UnityShaderVariables.html。

