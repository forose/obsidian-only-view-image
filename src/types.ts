/**
 * 图片查看器插件 - 类型定义
 */

/** 修饰键类型（内部值） */
export type ModifierKey = 'Ctrl' | 'Alt' | 'Meta';

/** 鼠标按键类型 */
export type MouseButton = 'left' | 'middle' | 'right';

/** 平台类型 */
export type PlatformType = 'win' | 'mac';

/** 快捷键配置 */
export interface ShortcutConfig {
    /** 修饰键列表，如 ['Ctrl'] */
    modifiers: ModifierKey[];
    /** 鼠标按键 */
    button: MouseButton;
}

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
    /** 用户选择的系统平台 */
    platform: PlatformType;
    /** 触发查看模式的快捷键配置 */
    shortcut: ShortcutConfig;
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
