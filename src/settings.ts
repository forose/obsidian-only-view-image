/**
 * 图片查看器插件 - 设置管理
 */

import { App, Platform, PluginSettingTab, Setting } from 'obsidian';
import type ImageViewerPlugin from './main';
import type { ImageViewerSettings, ModifierKey, MouseButton, PlatformType } from './types';

/** 根据平台自动检测默认值 */
const IS_MAC = Platform.isMacOS;

/** 平台对应的默认修饰键 */
const PLATFORM_DEFAULT_MODIFIER: Record<PlatformType, ModifierKey> = {
	win: 'Ctrl',
	mac: 'Meta',
};

/** 平台对应的修饰键选项（每个平台只保留两个常用键） */
const PLATFORM_MODIFIER_OPTIONS: Record<PlatformType, { key: ModifierKey; label: string }[]> = {
	win: [
		{ key: 'Ctrl', label: 'Ctrl' },
		{ key: 'Alt', label: 'Alt' },
	],
	mac: [
		{ key: 'Meta', label: 'Cmd' },
		{ key: 'Alt', label: 'Option' },
	],
};

/** 修饰键的显示名称映射 */
const MODIFIER_LABELS: Record<ModifierKey, Record<PlatformType, string>> = {
	Ctrl: { win: 'Ctrl', mac: 'Control' },
	Alt: { win: 'Alt', mac: 'Option' },
	Meta: { win: 'Win', mac: 'Cmd' },
};

/** 鼠标按键选项映射 */
const BUTTON_OPTIONS: Record<MouseButton, string> = {
	left: '左键',
	middle: '中键',
	right: '右键',
};

/** 默认设置 */
export const DEFAULT_SETTINGS: ImageViewerSettings = {
	platform: IS_MAC ? 'mac' : 'win',
	shortcut: {
		modifiers: [PLATFORM_DEFAULT_MODIFIER[IS_MAC ? 'mac' : 'win']],
		button: 'left',
	},
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

		const currentPlatform = this.plugin.settings.platform;

		new Setting(containerEl)
			.setName('图片查看器设置')
			.setHeading();

		// ===== 快捷键设置 =====
		new Setting(containerEl)
			.setName('快捷键')
			.setHeading();

		// 系统平台选择
		new Setting(containerEl)
			.setName('系统平台')
			.setDesc('选择你使用的操作系统，不同平台显示不同的修饰键选项')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('win', 'Windows / Linux')
					.addOption('mac', 'macOS')
					.setValue(currentPlatform)
					.onChange(async (value) => {
						const newPlatform = value as PlatformType;
						this.plugin.settings.platform = newPlatform;
						// 切换平台时重置修饰键为该平台的默认值
						this.plugin.settings.shortcut.modifiers = [PLATFORM_DEFAULT_MODIFIER[newPlatform]];
						await this.plugin.saveSettings();
						this.display();
					});
			});

		// 修饰键
		new Setting(containerEl)
			.setName('修饰键')
			.setDesc('选择触发图片查看模式的修饰键')
			.addDropdown((dropdown) => {
				const options = PLATFORM_MODIFIER_OPTIONS[currentPlatform];
				const currentMod = this.plugin.settings.shortcut.modifiers[0] ?? PLATFORM_DEFAULT_MODIFIER[currentPlatform];

				// 添加当前值（如果不是标准选项之一）
				const isStandardOption = options.some((o) => o.key === currentMod);
				if (!isStandardOption) {
					const label = MODIFIER_LABELS[currentMod]?.[currentPlatform] ?? currentMod;
					dropdown.addOption(currentMod, label);
				}

				// 添加平台对应的修饰键选项
				for (const option of options) {
					dropdown.addOption(option.key, option.label);
				}

				dropdown
					.setValue(currentMod)
					.onChange(async (value) => {
						this.plugin.settings.shortcut.modifiers = [value as ModifierKey];
						await this.plugin.saveSettings();
					});
			});

		// 鼠标按键
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

		// ===== 显示设置 =====
		new Setting(containerEl)
			.setName('显示')
			.setHeading();

		// 首次查看占窗口比例
		new Setting(containerEl)
			.setName('初始显示比例')
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
