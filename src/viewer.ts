/**
 * 图片查看器插件 - 核心查看器逻辑
 *
 * 负责图片查看模式的打开、关闭、缩放、旋转等交互功能。
 * 当查看器关闭时，所有 DOM 元素和事件监听器都会被清理。
 */

import type { ImageViewerSettings, ModifierKey } from './types';

/** 修饰键到 MouseEvent 属性的映射 */
const MODIFIER_MAP: Record<ModifierKey, keyof MouseEvent> = {
    Ctrl: 'ctrlKey',
    Alt: 'altKey',
    Meta: 'metaKey',
};

/** 鼠标按键到 button 值的映射 */
const BUTTON_MAP: Record<string, number> = {
    left: 0,
    middle: 1,
    right: 2,
};

/**
 * 图片查看器类
 *
 * 管理图片查看模式的完整生命周期，包括：
 * - 创建/销毁遮罩层和图片容器
 * - 缩放、旋转交互
 * - 事件监听器的注册与清理
 */
export class ImageViewer {
    /** 插件设置 */
    private settings: ImageViewerSettings;
    /** 遮罩层 DOM 元素 */
    private overlay: HTMLElement | null = null;
    /** 图片容器 DOM 元素 */
    private imageContainer: HTMLElement | null = null;
    /** 图片元素 */
    private imageEl: HTMLImageElement | null = null;
    /** 工具栏元素 */
    private toolbar: HTMLElement | null = null;
    private zoomMode: 'fit' | 'actual' | null = null; // fit: 适应窗口, actual: 实际尺寸
    /** 当前缩放比例 */
    private currentScale: number = 1;
    /** 当前旋转角度 */
    private currentRotation: number = 0;
    /** 是否正在拖拽图片 */
    private isDragging: boolean = false;
    /** 拖拽起始坐标 */
    private dragStart: { x: number; y: number } = { x: 0, y: 0 };
    /** 图片当前偏移量 */
    private offset: { x: number; y: number } = { x: 0, y: 0 };
    /** 已绑定的事件处理函数引用（用于正确移除监听器） */
    private boundHandlers: {
        wheel: ((e: WheelEvent) => void) | null;
        keydown: ((e: KeyboardEvent) => void) | null;
        mousemove: ((e: MouseEvent) => void) | null;
        mouseup: (() => void) | null;
        mousedown: ((e: MouseEvent) => void) | null;
    } = {
            wheel: null,
            keydown: null,
            mousemove: null,
            mouseup: null,
            mousedown: null,
        };
    /** 遮罩层点击关闭的监听器引用 */
    private overlayClickHandler: ((e: MouseEvent) => void) | null = null;

    constructor(settings: ImageViewerSettings) {
        this.settings = settings;
    }

    /**
     * 更新设置
     * 当用户在设置面板中修改配置时调用
     */
    updateSettings(settings: ImageViewerSettings): void {
        this.settings = settings;
    }

    /**
     * 检查鼠标事件是否匹配配置的快捷键
     */
    private matchesShortcut(e: MouseEvent): boolean {
        const { modifiers, button } = this.settings.shortcut;
        const expectedButton = BUTTON_MAP[button] ?? 0;

        // 检查鼠标按键
        if (e.button !== expectedButton) return false;

        // 检查所有配置的修饰键是否按下
        for (const mod of modifiers) {
            const key = MODIFIER_MAP[mod];
            if (!e[key]) return false;
        }

        // 检查未配置的修饰键是否未按下（避免误触发）
        const configuredMods = new Set(modifiers);
        const allMods: ModifierKey[] = ['Ctrl', 'Alt', 'Meta'];
        for (const mod of allMods) {
            if (!configuredMods.has(mod)) {
                const key = MODIFIER_MAP[mod];
                if (e[key]) return false;
            }
        }

        return true;
    }

    /**
     * 根据图片原始尺寸和窗口大小，计算使图片占窗口指定比例的缩放值
     * @param naturalWidth 图片原始宽度
     * @param naturalHeight 图片原始高度
     * @returns CSS scale 值
     */
    private calculateFitScale(naturalWidth: number, naturalHeight: number): number {
        const windowWidth = activeWindow.innerWidth;
        const windowHeight = activeWindow.innerHeight;
        const fitRatio = this.settings.initialFitPercent / 100;

        // 可用区域
        const availWidth = windowWidth * fitRatio;
        const availHeight = windowHeight * fitRatio;

        // 计算宽高比缩放，取较小值确保图片完整显示
        const scaleX = availWidth / naturalWidth;
        const scaleY = availHeight / naturalHeight;
        return Math.min(scaleX, scaleY);
    }

    /**
     * 打开图片查看模式
     * @param imgSrc 图片源地址
     */
    open(imgSrc: string): void {
        // 如果已经打开，先关闭
        if (this.overlay) {
            this.close();
            return;
        }

        // 初始化状态
        this.currentScale = 1;
        this.currentRotation = 0;
        this.offset = { x: 0, y: 0 };
        this.isDragging = false;

        // 创建遮罩层
        this.overlay = activeDocument.body.createEl('div', {
            cls: 'image-viewer-overlay',
        });

        // 应用遮罩层样式（毛玻璃、不透明度）
        this.applyOverlayStyles();

        // 创建图片容器
        this.imageContainer = this.overlay.createEl('div', {
            cls: 'image-viewer-container',
        });

        // 开启拖拽时添加对应类
        if (this.settings.draggable) {
            this.imageContainer.classList.add('is-draggable');
        }

        // 创建图片元素（初始隐藏，避免原始尺寸闪烁）
        this.imageEl = this.imageContainer.createEl('img', {
            cls: 'image-viewer-image image-viewer-image-loading',
            attr: { src: imgSrc, draggable: 'false' },
        });

        // 图片加载完成后计算初始缩放并显示
        this.imageEl.addEventListener('load', () => {
            const naturalWidth = this.imageEl?.naturalWidth ?? 0;
            const naturalHeight = this.imageEl?.naturalHeight ?? 0;
            
            // 根据自动缩放设置决定初始缩放比例
            if (this.settings.autoZoom) {
                // 开启自动缩放：计算适配窗口的比例
                this.currentScale = this.calculateFitScale(naturalWidth, naturalHeight);
            } else {
                // 关闭自动缩放：使用原始尺寸 1:1 显示
                this.currentScale = 1;
            }
            
            this.applyTransform();
            // 移除加载中类，显示图片
            this.imageEl?.classList.remove('image-viewer-image-loading');
        });

        // 创建工具栏
        this.toolbar = this.overlay.createEl('div', {
            cls: 'image-viewer-toolbar',
        });
        this.buildToolbar();

        // 注册事件监听器
        this.bindEvents();

        // 阻止遮罩层上的滚轮事件穿透到页面
        this.overlay.addEventListener('wheel', (e) => e.stopPropagation(), { passive: false });
    }

    /**
     * 应用遮罩层样式（毛玻璃、不透明度）
     * 通过 CSS 变量传递动态参数，CSS 类中引用这些变量
     */
    private applyOverlayStyles(): void {
        if (!this.overlay) return;

        const blurConfig = this.settings.blur;

        // 设置 CSS 变量供样式表使用
        this.overlay.style.setProperty('--image-viewer-blur-strength', `${blurConfig.strength}px`);
        this.overlay.style.setProperty('--image-viewer-overlay-opacity', `${blurConfig.overlayOpacity}`);

        // 根据是否启用毛玻璃添加对应类
        if (blurConfig.enabled) {
            this.overlay.classList.add('image-viewer-blur-enabled');
            this.overlay.classList.remove('image-viewer-blur-disabled');
        } else {
            this.overlay.classList.add('image-viewer-blur-disabled');
            this.overlay.classList.remove('image-viewer-blur-enabled');
        }
    }

    /**
     * 关闭图片查看模式，释放所有资源
     */
    close(): void {
        // 移除事件监听器
        this.unbindEvents();

        // 移除 DOM 元素
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        // 清空引用
        this.imageContainer = null;
        this.imageEl = null;
        this.toolbar = null;
        this.isDragging = false;
    }

    /**
     * 绑定所有事件监听器
     */
    private bindEvents(): void {
        // 滚轮缩放
        this.boundHandlers.wheel = (e: WheelEvent) => this.onWheel(e);
        this.overlay?.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });

        // ESC 关闭
        this.boundHandlers.keydown = (e: KeyboardEvent) => this.onKeyDown(e);
        activeDocument.addEventListener('keydown', this.boundHandlers.keydown);

        // 拖拽移动图片（仅开启拖拽设置时）
        if (this.settings.draggable) {
            this.boundHandlers.mousedown = (e: MouseEvent) => this.onMouseDown(e);
            this.imageContainer?.addEventListener('mousedown', this.boundHandlers.mousedown);

            this.boundHandlers.mousemove = (e: MouseEvent) => this.onMouseMove(e);
            activeDocument.addEventListener('mousemove', this.boundHandlers.mousemove);

            this.boundHandlers.mouseup = () => this.onMouseUp();
            activeDocument.addEventListener('mouseup', this.boundHandlers.mouseup);
        }

        // 点击遮罩层空白区域关闭（仅开启点击关闭设置时）
        if (this.settings.clickToClose) {
            this.overlayClickHandler = (e: MouseEvent) => {
                const target = e.target as HTMLElement;
                // 点击图片容器（非图片本身）或遮罩层时关闭
                if (target === this.overlay || target === this.imageContainer) {
                    this.close();
                }
            };
            this.overlay?.addEventListener('click', this.overlayClickHandler);
        }
    }

    /**
     * 移除所有事件监听器
     */
    private unbindEvents(): void {
        if (this.boundHandlers.wheel) {
            this.overlay?.removeEventListener('wheel', this.boundHandlers.wheel);
        }
        if (this.boundHandlers.keydown) {
            activeDocument.removeEventListener('keydown', this.boundHandlers.keydown);
        }
        if (this.boundHandlers.mousedown) {
            this.imageContainer?.removeEventListener('mousedown', this.boundHandlers.mousedown);
        }
        if (this.boundHandlers.mousemove) {
            activeDocument.removeEventListener('mousemove', this.boundHandlers.mousemove);
        }
        if (this.boundHandlers.mouseup) {
            activeDocument.removeEventListener('mouseup', this.boundHandlers.mouseup);
        }
        if (this.overlayClickHandler) {
            this.overlay?.removeEventListener('click', this.overlayClickHandler);
        }

        // 重置引用
        this.boundHandlers = {
            wheel: null,
            keydown: null,
            mousemove: null,
            mouseup: null,
            mousedown: null,
        };
        this.overlayClickHandler = null;
    }

    /**
     * 构建底部工具栏按钮
     */
    private buildToolbar(): void {
        if (!this.toolbar) return;

        // 左旋转按钮
        this.createToolbarButton('rotate_left', '向左旋转 90°', () => {
            this.currentRotation -= 90;
            this.applyTransform();
        });

        // 右旋转按钮
        this.createToolbarButton('rotate_right', '向右旋转 90°', () => {
            this.currentRotation += 90;
            this.applyTransform();
        });
        // 适应屏幕按钮
        this.createToolbarButton('fit_screen', '适应窗口', (btn) => {
            this.zoomMode = this.zoomMode ?? (this.settings.autoZoom ? 'fit' : 'actual');
            if (this.zoomMode === 'fit') {
                // 切换到实际尺寸
                this.zoomMode = 'actual';
                this.currentScale = 1;
                btn?.setAttribute('title', '适应窗口');
            } else {
                // 切换到适应窗口
                this.zoomMode = 'fit';
                const naturalWidth = this.imageEl?.naturalWidth ?? 0;
                const naturalHeight = this.imageEl?.naturalHeight ?? 0;
                btn?.setAttribute('title', '实际尺寸');
                this.currentScale = this.calculateFitScale(naturalWidth, naturalHeight);
            }
            this.currentRotation = 0;
            this.offset = { x: 0, y: 0 };
            this.applyTransform();
        });
        // 重置按钮
        this.createToolbarButton('restart_alt', '重置视图', () => {
            const naturalWidth = this.imageEl?.naturalWidth ?? 0;
            const naturalHeight = this.imageEl?.naturalHeight ?? 0;
            if (this.settings.autoZoom) {
                this.currentScale = this.calculateFitScale(naturalWidth, naturalHeight);
            } else {
                this.currentScale = 1;
            }
            this.currentRotation = 0;
            this.offset = { x: 0, y: 0 };
            this.applyTransform();
        });

        // 关闭按钮
        this.createToolbarButton('close', '关闭 (Esc)', () => {
            this.close();
        });
    }

    /**
     * 创建工具栏按钮
     * 使用 Google Material Symbols 图标
     */
    private createToolbarButton(icon: string, title: string, onClick: (btn?: HTMLElement) => void): void {
        if (!this.toolbar) return;

        const btn = this.toolbar.createEl('button', {
            cls: 'image-viewer-toolbar-btn',
            attr: { title },
        });

        btn.createEl('span', {
            cls: 'material-symbols-rounded',
            text: icon,
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(btn);
        });
    }
    /**
     * 应用 CSS 变换（缩放 + 旋转 + 平移）
     */
    private applyTransform(): void {
        if (!this.imageEl) return;

        this.imageEl.style.transform =
            `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.currentScale}) rotate(${this.currentRotation}deg)`;
    }

    /**
     * 滚轮事件处理 - 缩放图片
     */
    private onWheel(e: WheelEvent): void {
        e.preventDefault();

        // 根据滚轮方向调整缩放
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newScale = Math.max(0.1, this.currentScale + delta);

        // 限制最大缩放
        if (newScale <= 10) {
            this.currentScale = Math.round(newScale * 10) / 10;
            this.applyTransform();
        }
    }

    /**
     * 键盘事件处理 - ESC 关闭查看器
     */
    private onKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    }

    /**
     * 鼠标按下 - 开始拖拽
     */
    private onMouseDown(e: MouseEvent): void {
        // 仅左键拖拽
        if (e.button !== 0) return;

        e.preventDefault();
        this.isDragging = true;
        this.dragStart = { x: e.clientX - this.offset.x, y: e.clientY - this.offset.y };

        // 添加拖拽光标样式
        this.imageContainer?.classList.add('is-dragging');
    }

    /**
     * 鼠标移动 - 拖拽图片
     */
    private onMouseMove(e: MouseEvent): void {
        if (!this.isDragging) return;

        this.offset.x = e.clientX - this.dragStart.x;
        this.offset.y = e.clientY - this.dragStart.y;
        this.applyTransform();
    }

    /**
     * 鼠标松开 - 结束拖拽
     */
    private onMouseUp(): void {
        this.isDragging = false;
        this.imageContainer?.classList.remove('is-dragging');
    }

    /**
     * 处理文档中的鼠标点击事件
     * 由 Plugin 在全局注册，判断是否触发图片查看
     */
    handleDocumentClick(e: MouseEvent): void {
        // 检查是否匹配快捷键
        if (!this.matchesShortcut(e)) return;

        // 查找点击目标是否为图片
        const target = e.target as HTMLElement;
        const img = target.closest('img');
        if (!img) return;

        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();

        // 获取图片源地址
        const imgSrc = img.src;
        if (!imgSrc) return;

        // 打开查看器
        this.open(imgSrc);
    }

    /**
     * 检查查看器是否已打开
     */
    isOpen(): boolean {
        return this.overlay !== null;
    }

    /**
     * 销毁查看器，释放所有资源
     * 在插件卸载时调用
     */
    destroy(): void {
        this.close();
    }
}
