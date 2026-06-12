/**
 * 图片查看器插件 - 入口文件
 *
 * 负责插件生命周期管理（加载/卸载）、设置持久化、
 * 全局事件监听器的注册与清理。
 */

import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, ImageViewerSettingTab } from './settings';
import type { ImageViewerSettings } from './types';
import { ImageViewer } from './viewer';

export default class ImageViewerPlugin extends Plugin {
	settings!: ImageViewerSettings;
	/** 图片查看器实例 */
	private viewer: ImageViewer | null = null;
	/** 文档点击事件处理函数引用 */
	private clickHandler: ((e: MouseEvent) => void) | null = null;

	async onload() {
		// 加载设置
		await this.loadSettings();

		// 创建图片查看器实例
		this.viewer = new ImageViewer(this.settings);

		// 注册全局鼠标点击事件监听器
		// 使用捕获阶段确保在 Obsidian 默认处理之前拦截
		this.clickHandler = (e: MouseEvent) => {
			this.viewer?.handleDocumentClick(e);
		};
		activeDocument.addEventListener('mousedown', this.clickHandler, true);

		// 注册设置面板
		this.addSettingTab(new ImageViewerSettingTab(this.app, this));
	}

	onunload() {
		// 移除全局事件监听器
		if (this.clickHandler) {
			activeDocument.removeEventListener('mousedown', this.clickHandler, true);
			this.clickHandler = null;
		}

		// 销毁查看器，释放所有资源
		if (this.viewer) {
			this.viewer.destroy();
			this.viewer = null;
		}
	}

	/**
	 * 加载设置，合并默认值
	 */
	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData() as Partial<ImageViewerSettings>,
		);
	}

	/**
	 * 保存设置，并同步更新查看器实例
	 */
	async saveSettings() {
		await this.saveData(this.settings);
		// 同步更新查看器中的设置引用
		this.viewer?.updateSettings(this.settings);
	}
}
