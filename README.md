# Obsidian Image Viewer

更好的查看文章中的图片

## 功能特性

- **快捷触发** — 鼠标双击打开图片视图
- **智能缩放** — 支持配置是否自适应，图片按窗口比例自适应显示，滚轮可继续缩放，下方工具栏支持一键模式切换
- **旋转操作** — 支持左旋/右旋 90°，一键重置视图
- **毛玻璃遮罩** — 可选的背景模糊效果，强度和不透明度可调
- **点击空白关闭** — 点击图片以外区域即可退出查看模式
- **拖拽移动** — 可选开启图片拖拽移动
- **主题适配** — 自动适配 Obsidian 深色/浅色主题
- **Material Design** — 工具栏采用 Google Material Design 风格

## 使用方式

1. 在文档中找到想要查看的图片
2. 双击图片，自动打开图片视图
3. 进入查看模式后：
   - **滚轮** — 缩放图片
   - **ESC** — 退出查看模式
   - **底部工具栏** — 旋转、模式切换、一键重置、关闭

## 插件设置

| 设置项 | 默认值 | 说明 |
|--------|--------|------|
| 是否自适应 | 是 | 图片默认窗口自适应 |
| 默认显示比例 | 80% | 图片占窗口的百分比 |
| 点击空白区域关闭 | 开启 | 点击图片以外区域关闭查看模式 |
| 允许拖拽移动 | 关闭 | 在查看模式下拖拽移动图片 |
| 启用毛玻璃 | 关闭 | 为背景遮罩添加模糊效果 |
| 模糊强度 | 16px | 遮罩层的模糊程度 |
| 遮罩不透明度 | 0.5 | 遮罩层的暗度 |

## 安装

### 手动安装

1. 从 [Releases](https://github.com/forose/obsidian-image-viewer/releases) 下载最新版本
2. 将 `main.js`、`styles.css`、`manifest.json` 复制到你的 Vault 目录下：`VaultFolder/.obsidian/plugins/image-viewer/`
3. 重启 Obsidian
4. 在 **设置 → 社区插件** 中启用本插件

### 从源码构建

```bash
git clone https://github.com/forose/obsidian-image-viewer.git
cd obsidian-image-viewer
npm install
npm run build
```

将生成的 `main.js`、`styles.css`、`manifest.json` 复制到插件目录即可。

## 开发

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化自动重新编译）
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

## 兼容性

- 最低 Obsidian 版本：1.0.0
- 支持桌面端和移动端

## 许可证

0-BSD
