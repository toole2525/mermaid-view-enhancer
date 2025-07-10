import { App, PluginSettingTab, Setting } from 'obsidian';
import MermaidViewEnhancer from './main';

// 設定の型定義を更新
export interface MermaidViewEnhancerSettings {
	maxZoom: number;
	zoomStep: number;
	wheelSensitivity: number;
	animationDuration: number;
	containerWidthMode: 'auto' | 'custom' | 'fullwidth';
	customWidth: number;
}

// デフォルト設定
export const DEFAULT_SETTINGS: MermaidViewEnhancerSettings = {
	maxZoom: 3.0,
	zoomStep: 0.1,
	wheelSensitivity: 100,  // パーセント表示（100% = 標準）
	animationDuration: 0.2,
	containerWidthMode: 'auto',
	customWidth: 800,
};

export class MermaidViewEnhancerSettingTab extends PluginSettingTab {
	plugin: MermaidViewEnhancer;

	constructor(app: App, plugin: MermaidViewEnhancer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// タイトル
		containerEl.createEl('h2', { text: 'Mermaid View Enhancer Settings' });

		// ズーム設定セクション
		containerEl.createEl('h3', { text: 'Zoom Settings' });

		// 最大ズーム
		new Setting(containerEl)
			.setName('Maximum zoom level')
			.setDesc('Maximum zoom level (larger values allow zooming in more)')
			.addSlider(slider => slider
				.setLimits(2.0, 5.0, 0.5)
				.setValue(this.plugin.settings.maxZoom)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.maxZoom = value;
					await this.plugin.saveSettings();
				}));

		// ホイール感度（パーセント表示）
		new Setting(containerEl)
			.setName('Mouse wheel sensitivity')
			.setDesc('How fast zooming responds to mouse wheel (100% = standard speed)')
			.addSlider(slider => slider
				.setLimits(25, 200, 25)  // 25%〜200%、25%刻み
				.setValue(this.plugin.settings.wheelSensitivity)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.wheelSensitivity = value;
					await this.plugin.saveSettings();
				}))
			.addExtraButton(button => button
				.setIcon('reset')
				.setTooltip('Reset to default (100%)')
				.onClick(async () => {
					this.plugin.settings.wheelSensitivity = DEFAULT_SETTINGS.wheelSensitivity;
					await this.plugin.saveSettings();
					this.display();
				}))
			.then(setting => {
				// パーセント表示のカスタムツールチップ
				const slider = setting.controlEl.querySelector('input[type="range"]') as HTMLInputElement;
				if (slider) {
					const updateTooltip = () => {
						slider.title = `${slider.value}%`;
					};
					updateTooltip();
					slider.addEventListener('input', updateTooltip);
				}
			});

		// アニメーション設定セクション
		containerEl.createEl('h3', { text: 'Animation Settings' });

		// アニメーション速度
		new Setting(containerEl)
			.setName('Animation duration')
			.setDesc('Duration of zoom animations in seconds (0 = no animation)')
			.addSlider(slider => slider
				.setLimits(0, 0.5, 0.05)
				.setValue(this.plugin.settings.animationDuration)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.animationDuration = value;
					await this.plugin.saveSettings();
				}));

		// 表示設定セクション
		containerEl.createEl('h3', { text: 'Display Settings' });

		// コンテナ幅モード
		new Setting(containerEl)
			.setName('Container width mode')
			.setDesc('How the diagram container width is determined')
			.addDropdown(dropdown => dropdown
				.addOption('auto', 'Auto (use default)')
				.addOption('custom', 'Custom width')
				.addOption('fullwidth', 'Full width')
				.setValue(this.plugin.settings.containerWidthMode)
				.onChange(async (value: 'auto' | 'custom' | 'fullwidth') => {
					this.plugin.settings.containerWidthMode = value;
					await this.plugin.saveSettings();
					this.display(); // 再描画してカスタム幅設定の表示/非表示を切り替え
				}));

		// カスタム幅設定（モードがcustomの時のみ表示）
		if (this.plugin.settings.containerWidthMode === 'custom') {
			new Setting(containerEl)
				.setName('Custom width')
				.setDesc('Custom width for diagram containers in pixels')
				.addText(text => text
					.setPlaceholder('800')
					.setValue(this.plugin.settings.customWidth.toString())
					.onChange(async (value) => {
						const numValue = parseInt(value);
						if (!isNaN(numValue) && numValue > 0) {
							this.plugin.settings.customWidth = numValue;
							await this.plugin.saveSettings();
						}
					}));
		}

		// リセット設定セクション
		containerEl.createEl('h3', { text: 'Reset Settings' });
		
		new Setting(containerEl)
			.setName('Reset all settings')
			.setDesc('Reset all settings to their default values')
			.addButton(button => button
				.setButtonText('Reset to defaults')
				.setWarning()
				.onClick(async () => {
					this.plugin.settings = { ...DEFAULT_SETTINGS };
					await this.plugin.saveSettings();
					this.display();
				}));

		// 使用方法説明
		containerEl.createEl('h3', { text: 'How to Use' });
		
		const instructionsEl = containerEl.createDiv();
		const listEl = instructionsEl.createEl('ul');

		// Mouse wheel
		const mouseWheelLi = listEl.createEl('li');
		mouseWheelLi.createEl('strong', { text: 'Mouse wheel:' });
		mouseWheelLi.appendText(` Zoom in/out centered on mouse position (100% - ${this.plugin.settings.maxZoom * 100}%)`);

		// Click and drag
		const clickDragLi = listEl.createEl('li');
		clickDragLi.createEl('strong', { text: 'Click and drag:' });
		clickDragLi.appendText(' Pan around at any zoom level');

		// Double-click
		const doubleClickLi = listEl.createEl('li');
		doubleClickLi.createEl('strong', { text: 'Double-click:' });
		doubleClickLi.appendText(' Reset to 100% zoom and center position');

		// Touch
		const touchLi = listEl.createEl('li');
		touchLi.createEl('strong', { text: 'Touch:' });
		touchLi.appendText(' Pinch to zoom, drag to pan');
	}
}