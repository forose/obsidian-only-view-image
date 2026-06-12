/**
 * 图片查看器插件 - 设置管理
 */

import { App, PluginSettingTab, Setting } from 'obsidian';
import type ImageViewerPlugin from './main';
import type { ImageViewerSettings, ModifierKey, MouseButton } from './types';

/** 默认设置 */
export const DEFAULT_SETTINGS: ImageViewerSettings = {
	shortcut: {
		modifiers: ['Ctrl'],
		button: 'left',
	},
	initialScale: 1,
};

/** 修饰键选项映射 */
export const MODIFIER_OPTIONS: Record<ModifierKey, string> = {
	Ctrl: 'Ctrl',
	Alt: 'Alt',
	Shift: 'Shift',
	Meta: 'Meta (Cmd)',
};

/** 鼠标按键选项映射 */
export const BUTTON_OPTIONS: Record<MouseButton, string> = {
	left: '左键',
	middle: '中键',
	right: '右键',
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
			.setName('图片查看器设置')
			.setHeading();

		// 快捷键 - 修饰键
		new Setting(containerEl)
			.setName('修饰键')
			.setDesc('选择触发图片查看模式的修饰键（可多选）')
			.addDropdown((dropdown) => {
				// 生成当前选中值的显示文本
				const currentMods = this.plugin.settings.shortcut.modifiers;
				const displayValue = currentMods.length > 0
					? currentMods.join('+')
					: '无';

				dropdown
					.addOption(displayValue, displayValue)
					.addOption('Ctrl', 'Ctrl')
					.addOption('Alt', 'Alt')
					.addOption('Shift', 'Shift')
					.addOption('Ctrl+Shift', 'Ctrl+Shift')
					.addOption('Ctrl+Alt', 'Ctrl+Alt')
					.setValue(displayValue)
					.onChange(async (value) => {
						this.plugin.settings.shortcut.modifiers = value.split('+') as ModifierKey[];
						await this.plugin.saveSettings();
						// 刷新显示
						this.display();
					});
			});

		// 快捷键 - 鼠标按键
		new Setting(containerEl)
			.setName('鼠标按键')
			.setDesc('选择触发图片查看模式的鼠标按键')
			.addDropdown((dropdown) => {
				for (const [key, label] of Object.entries(BUTTON_OPTIONS)) {
					dropdown.addOption(key, label);
				}
				dropdown
					.setValue(this.plugin.settings.shortcut.button)
					.onChange(async (value) => {
						this.plugin.settings.shortcut.button = value as MouseButton;
						await this.plugin.saveSettings();
					});
			});

		// 首次放大比例
		new Setting(containerEl)
			.setName('首次放大比例')
			.setDesc('进入查看模式时图片的初始放大倍数（1.0 = 原始大小，2.0 = 放大两倍）')
			.addSlider((slider) => {
				slider
					.setLimits(1, 2, 0.1)
					.setValue(this.plugin.settings.initialScale)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.initialScale = Math.round(value * 10) / 10;
						await this.plugin.saveSettings();
					});
			});
	}
}
