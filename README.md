# 森林的奥妙 · Whispers of the Forest

单页静态站点，无后端。直接双击 `index.html` 即可在浏览器打开。

## 目录结构

```
forest-site/
├── index.html          # 页面结构（文字介绍已生成）
├── style.css           # 全部样式 + 鼠标划过特效
├── videos/
│   └── forest-hero.mp4 # ← 把你上传的 hero 视频放这里（改名成 forest-hero.mp4）
└── images/
    ├── poster.jpg      # ← hero 视频封面图（可选）
    ├── forest-01.jpg   # ← 画廊图片 1
    ├── forest-02.jpg   # ← 画廊图片 2
    ├── forest-03.jpg
    ├── forest-04.jpg
    ├── forest-05.jpg
    └── forest-06.jpg
```

## 怎么替换成你自己的素材

1. **Hero 视频**：把视频放进 `videos/`，命名为 `forest-hero.mp4`。
   （若格式是 `.webm` 或别的，改 `index.html` 里 `<source src="...">` 那行即可。）
2. **画廊图片**：把图片放进 `images/`，命名 `forest-01.jpg` … `forest-06.jpg`。
   想加更多张，就复制 `index.html` 里一个 `<figure class="gallery__item">...</figure>` 整块，改路径和说明文字。
3. **文字介绍**：都写在 `index.html` 里，直接改成你自己的话就行。

## 已有的鼠标划过特效

- 图片：放大 + 轻微旋转 + 提亮饱和 + 金色描边内发光
- 说明文字：从底部滑入显示
- 触屏设备：点击会触发同样的 `is-touch` 效果

> 「后面我会加给你」的触碰特效，届时把新的 CSS/JS 发我，我直接接进
> `style.css` 的 `.gallery__item:hover` 区块替换即可，结构不用动。

## 预览

浏览器打开 `index.html`。想用本地服务器（推荐，视频/图片加载更稳）：

```powershell
cd forest-site
python -m http.server 8080
# 然后访问 http://localhost:8080
```
