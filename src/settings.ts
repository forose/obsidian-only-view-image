/**
 * 图片查看器插件 - 设置管理
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type ImageViewerPlugin from './main';
import type { ImageViewerSettings } from './types';

/** 默认设置 */
export const DEFAULT_SETTINGS: ImageViewerSettings = {
	autoZoom: true,
	initialFitPercent: 80,
	blur: {
		enabled: false,
		strength: 16,
		overlayOpacity: 0.5,
	},
	clickToClose: true,
	draggable: false,
};

/** 设置面板 */
export class ImageViewerSettingTab extends PluginSettingTab {
	plugin: ImageViewerPlugin;

	constructor(app: App, plugin: ImageViewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('图片工具设置')
			.setHeading();

		// ===== 显示设置 =====
		new Setting(containerEl)
			.setName('显示')
			.setHeading();
		
		// 自动缩放开关
		new Setting(containerEl)
			.setName('自动缩放')
			.setDesc('开启后，图片将自动适应窗口大小；关闭后可手动调整图片大小')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.autoZoom)
					.onChange(async (value) => {
						this.plugin.settings.autoZoom = value;
						await this.plugin.saveSettings();
						this.display(); // 刷新设置面板，控制默认显示比例的显示/隐藏
					});
			});
		if (this.plugin.settings.autoZoom) {
			new Setting(containerEl)
				.setName('默认显示比例')
				.setDesc('进入查看模式时图片占窗口的百分比（80 = 占窗口 80%）')
				.addSlider((slider) => {
					slider
						.setLimits(20, 100, 5)
						.setValue(this.plugin.settings.initialFitPercent)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.initialFitPercent = value;
							await this.plugin.saveSettings();
						});
				});
		}

		// ===== 交互设置 =====
		new Setting(containerEl)
			.setName('交互')
			.setHeading();

		// 点击空白区域关闭
		new Setting(containerEl)
			.setName('点击空白区域关闭')
			.setDesc('开启后，点击图片以外的区域可关闭查看模式')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.clickToClose)
					.onChange(async (value) => {
						this.plugin.settings.clickToClose = value;
						await this.plugin.saveSettings();
					});
			});

		// 允许拖拽移动图片
		new Setting(containerEl)
			.setName('允许拖拽移动')
			.setDesc('开启后，可在查看模式下拖拽移动图片位置')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.draggable)
					.onChange(async (value) => {
						this.plugin.settings.draggable = value;
						await this.plugin.saveSettings();
					});
			});

		// ===== 毛玻璃设置 =====
		new Setting(containerEl)
			.setName('毛玻璃效果')
			.setHeading();

		// 是否启用毛玻璃
		new Setting(containerEl)
			.setName('启用毛玻璃')
			.setDesc('为背景遮罩添加模糊效果')
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.blur.enabled)
					.onChange(async (value) => {
						this.plugin.settings.blur.enabled = value;
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// 模糊强度和不透明度（仅在启用毛玻璃时显示）
		if (this.plugin.settings.blur.enabled) {
			new Setting(containerEl)
				.setName('模糊强度')
				.setDesc('遮罩层的模糊程度（像素），值越大越模糊')
				.addSlider((slider) => {
					slider
						.setLimits(1, 40, 1)
						.setValue(this.plugin.settings.blur.strength)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.blur.strength = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(containerEl)
				.setName('遮罩不透明度')
				.setDesc('遮罩层的暗度，值越大背景越暗')
				.addSlider((slider) => {
					slider
						.setLimits(0.1, 0.9, 0.05)
						.setValue(this.plugin.settings.blur.overlayOpacity)
						.setDynamicTooltip()
						.onChange(async (value) => {
							this.plugin.settings.blur.overlayOpacity = Math.round(value * 100) / 100;
							await this.plugin.saveSettings();
						});
				});
		}
	}
}
