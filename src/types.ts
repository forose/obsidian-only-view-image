/**
 * 图片查看器插件 - 类型定义
 */

/** 毛玻璃样式配置 */
export interface BlurConfig {
    /** 是否启用毛玻璃效果 */
    enabled: boolean;
    /** 模糊强度（像素），范围 0-40 */
    strength: number;
    /** 遮罩层不透明度，范围 0-1 */
    overlayOpacity: number;
}

/** 插件设置接口 */
export interface ImageViewerSettings {
    /** 是否自动缩放图片以适应窗口 */
    autoZoom: boolean;
    /** 首次查看时图片占窗口的比例（80 = 占窗口 80%） */
    initialFitPercent: number;
    /** 毛玻璃样式配置 */
    blur: BlurConfig;
    /** 点击非图片区域是否关闭查看模式 */
    clickToClose: boolean;
    /** 是否允许拖拽移动图片 */
    draggable: boolean;
}
