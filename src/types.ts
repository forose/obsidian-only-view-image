/**
 * 图片查看器插件 - 类型定义
 */

/** 修饰键类型 */
export type ModifierKey = 'Ctrl' | 'Alt' | 'Shift' | 'Meta';

/** 鼠标按键类型 */
export type MouseButton = 'left' | 'middle' | 'right';

/** 快捷键配置 */
export interface ShortcutConfig {
    /** 修饰键列表，如 ['Ctrl'] */
    modifiers: ModifierKey[];
    /** 鼠标按键 */
    button: MouseButton;
}

/** 插件设置接口 */
export interface ImageViewerSettings {
    /** 触发查看模式的快捷键配置 */
    shortcut: ShortcutConfig;
    /** 首次放大比例（1 = 100%，2 = 200%） */
    initialScale: number;
}
