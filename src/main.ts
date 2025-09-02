import { Plugin, debounce } from 'obsidian';
import { MermaidViewEnhancerSettings, MermaidViewEnhancerSettingTab, DEFAULT_SETTINGS } from './settings';

// 図表の状態管理の型定義
interface DiagramState {
	zoom: number;
	panX: number;
	panY: number;
	isDragging: boolean;
	dragStartX: number;
	dragStartY: number;
	lastTouchDistance: number;
}

export default class MermaidViewEnhancer extends Plugin {
	settings: MermaidViewEnhancerSettings;

	// DOM変更の監視
	private observer: MutationObserver | null = null;
	private debouncedScan: () => void;

	async onload() {
		console.log('🎯 Mermaid View Enhancer プラグイン開始');

		// 設定を読み込み
		await this.loadSettings();

		// 設定タブを追加
		this.addSettingTab(new MermaidViewEnhancerSettingTab(this.app, this));

		// 機能開始
		this.startEnhancement();
	}

	onunload() {
		console.log('🔄 Mermaid View Enhancer プラグイン終了');
		this.stopEnhancement();
	}

	/**
	 * 設定を読み込み
	 */
	async loadSettings() {
		const savedData = await this.loadData();
		let loadedSettings = Object.assign({}, DEFAULT_SETTINGS, savedData);
		
		// 古い形式のwheelSensitivity値を新形式に変換（0.002 -> 100）
		if (loadedSettings.wheelSensitivity < 1) {
			loadedSettings.wheelSensitivity = loadedSettings.wheelSensitivity * 50000; // 0.002 * 50000 = 100
		}
		
		// 現在の設定型に適合するプロパティのみを抽出（型安全）
		this.settings = {
			maxZoom: loadedSettings.maxZoom,
			zoomStep: loadedSettings.zoomStep,
			wheelSensitivity: loadedSettings.wheelSensitivity,
			animationDuration: loadedSettings.animationDuration,
			containerWidthMode: loadedSettings.containerWidthMode,
			customWidth: loadedSettings.customWidth,
		};
	}

	/**
	 * 設定を保存
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * 機能を開始
	 */
	startEnhancement() {
		// 図表スキャンのデバウンス処理
		this.debouncedScan = debounce(this.scanAndEnhanceDiagrams.bind(this), 500, true);

		// 初回スキャン
		this.scanAndEnhanceDiagrams();

		// DOM変更の監視開始
		this.startObservingDOM();

		// ビュー切り替え時の処理
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.debouncedScan();
			})
		);

		// ファイル切り替え時の処理
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				setTimeout(() => this.debouncedScan(), 100);
			})
		);

		console.log('✅ Mermaid View Enhancer 機能開始');
	}

	/**
	 * 機能を停止
	 */
	stopEnhancement() {
		// DOM監視を停止
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		// 全ての強化された図表をリセット
		this.resetAllDiagrams();

		console.log('⏹️ Mermaid View Enhancer 機能停止');
	}

	/**
	 * DOM変更の監視を開始
	 */
	private startObservingDOM() {
		this.observer = new MutationObserver((mutations) => {
			let shouldScan = false;
			
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							const element = node as HTMLElement;
							// Mermaid図表の追加を検出
							if (element.classList.contains('mermaid') || 
								element.querySelector('.mermaid')) {
								shouldScan = true;
							}
						}
					});
				}
			});

			if (shouldScan) {
				this.debouncedScan();
			}
		});

		// プレビューエリアを監視
		this.observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	}

	/**
	 * 図表をスキャンして機能を適用
	 */
	private scanAndEnhanceDiagrams() {
		// 表示されているmermaid図表のみを選択（編集ビューとリーディングビュー両対応）
		const visibleMermaids = Array.from(document.querySelectorAll('.mermaid')).filter(el => {
			const element = el as HTMLElement;
			
			// 基本的な表示チェック
			if (element.offsetParent === null || element.hasAttribute('data-zoom-enhanced')) {
				return false;
			}
			
			// SVGが含まれているMermaid図表のみを対象とする
			// （レンダリング済みの図表を確実に検出）
			const hasSvg = element.querySelector('svg') !== null;
			if (!hasSvg) {
				return false;
			}
			
			// 親要素の存在確認
			if (!element.parentElement) {
				return false;
			}
			
			// 特定のクラス名に依存せず、表示されているMermaid図表を幅広く検出
			return true;
		}) as HTMLElement[];

		if (visibleMermaids.length === 0) return;

		visibleMermaids.forEach((diagram, index) => {
			this.enhanceDiagram(diagram, index);
		});
	}

	/**
	 * 個別の図表に機能を適用
	 */
	private enhanceDiagram(diagram: HTMLElement, index: number) {
		// 既に処理済みなら何もしない
		if (diagram.hasAttribute('data-zoom-enhanced')) {
			return;
		}

		// リーディングビュー用のwrapper作成
		this.createWrapperIfNeeded(diagram);

		// 表示枠の幅を調整
		this.adjustContainerWidth(diagram);

		// 状態管理
		const state: DiagramState = {
			zoom: 1.0, // 初期ズームは100%固定
			panX: 0,
			panY: 0,
			isDragging: false,
			dragStartX: 0,
			dragStartY: 0,
			lastTouchDistance: 0
		};

		// 基本スタイル設定（静的スタイルはCSSで管理）
		// 動的スタイル（設定依存）のみをJavaScriptで設定
		diagram.style.transition = `transform ${this.settings.animationDuration}s ease-out`;
		
		// 処理済みマークを追加（CSSセレクターで使用）
		diagram.setAttribute('data-zoom-enhanced', 'true');

		// トランスフォーム適用関数
		const applyTransform = () => {
			const transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
			diagram.style.transform = transform;

			// cursor状態をCSSクラスで管理
			if (state.isDragging) {
				diagram.classList.add('is-dragging');
			} else {
				diagram.classList.remove('is-dragging');
			}
		};

		// ダブルクリック：リセット
		const handleDoubleClick = (e: MouseEvent) => {
			e.preventDefault();
			state.zoom = 1.0; // 100%固定
			state.panX = 0;
			state.panY = 0;
			applyTransform();
		};

		// マウスホイール：正確なマウス位置中心ズーム
		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();

			const rect = diagram.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;

			// 現在のマウス位置での図表上の実座標を計算
			const currentPointX = (mouseX - state.panX) / state.zoom;
			const currentPointY = (mouseY - state.panY) / state.zoom;

			// ズーム計算（パーセント値を内部値に変換）
			const wheelSensitivity = this.settings.wheelSensitivity * 0.00002; // 100% = 0.002
			const deltaZoom = -e.deltaY * wheelSensitivity;
			const oldZoom = state.zoom;
			state.zoom = Math.max(1.0, Math.min(this.settings.maxZoom, state.zoom + deltaZoom)); // 最小ズーム100%固定

			// ズーム後もマウス位置に同じ実座標が来るように調整
			if (state.zoom !== oldZoom) {
				state.panX = mouseX - currentPointX * state.zoom;
				state.panY = mouseY - currentPointY * state.zoom;
				applyTransform();
			}
		};

		// マウスドラッグ処理（常に有効）
		const handleMouseDown = (e: MouseEvent) => {
			state.isDragging = true;
			state.dragStartX = e.clientX - state.panX;
			state.dragStartY = e.clientY - state.panY;
			applyTransform();
			e.preventDefault();

			// グローバルイベントリスナーを追加
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
		};

		const handleMouseMove = (e: MouseEvent) => {
			if (state.isDragging) {
				state.panX = e.clientX - state.dragStartX;
				state.panY = e.clientY - state.dragStartY;
				applyTransform();
			}
		};

		const handleMouseUp = () => {
			if (state.isDragging) {
				state.isDragging = false;
				applyTransform();
				// イベントリスナーを削除
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
			}
		};

		// タッチ操作処理
		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				state.lastTouchDistance = Math.sqrt(
					Math.pow(touch2.clientX - touch1.clientX, 2) +
					Math.pow(touch2.clientY - touch1.clientY, 2)
				);
			} else if (e.touches.length === 1) {
				// 常にドラッグ可能
				state.isDragging = true;
				state.dragStartX = e.touches[0].clientX - state.panX;
				state.dragStartY = e.touches[0].clientY - state.panY;
				applyTransform();
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				e.preventDefault();
				const touch1 = e.touches[0];
				const touch2 = e.touches[1];
				const currentDistance = Math.sqrt(
					Math.pow(touch2.clientX - touch1.clientX, 2) +
					Math.pow(touch2.clientY - touch1.clientY, 2)
				);

				if (state.lastTouchDistance > 0) {
					const scale = currentDistance / state.lastTouchDistance;
					const oldZoom = state.zoom;
					state.zoom = Math.max(1.0, Math.min(this.settings.maxZoom, state.zoom * scale)); // 最小ズーム100%固定

					const rect = diagram.getBoundingClientRect();
					const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left;
					const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top;

					if (state.zoom !== oldZoom) {
						const currentPointX = (centerX - state.panX) / oldZoom;
						const currentPointY = (centerY - state.panY) / oldZoom;
						state.panX = centerX - currentPointX * state.zoom;
						state.panY = centerY - currentPointY * state.zoom;
					}

					applyTransform();
				}

				state.lastTouchDistance = currentDistance;
			} else if (e.touches.length === 1 && state.isDragging) {
				// 常にドラッグ可能
				e.preventDefault();
				state.panX = e.touches[0].clientX - state.dragStartX;
				state.panY = e.touches[0].clientY - state.dragStartY;
				applyTransform();
			}
		};

		const handleTouchEnd = () => {
			state.isDragging = false;
			state.lastTouchDistance = 0;
			applyTransform();
		};

		// イベントリスナーを登録
		diagram.addEventListener('dblclick', handleDoubleClick);
		diagram.addEventListener('wheel', handleWheel);
		diagram.addEventListener('mousedown', handleMouseDown);
		diagram.addEventListener('touchstart', handleTouchStart);
		diagram.addEventListener('touchmove', handleTouchMove);
		diagram.addEventListener('touchend', handleTouchEnd);
	}

	/**
	 * リーディングビュー用のwrapper要素を作成
	 */
	private createWrapperIfNeeded(diagram: HTMLElement) {
		const parent = diagram.parentElement;
		if (!parent) return;

		// 編集ビューの場合はwrapperを作成しない
		if (parent.className.includes('cm-preview-code-block')) {
			return;
		}

		// 既にwrapperが存在する場合はスキップ
		if (parent.classList.contains('mermaid-wrapper')) {
			return;
		}

		// wrapper要素を作成（スタイルはCSSで管理）
		const wrapper = document.createElement('div');
		wrapper.className = 'mermaid-wrapper';

		// 図表をwrapperで包む
		parent.insertBefore(wrapper, diagram);
		wrapper.appendChild(diagram);
	}

	/**
	 * 表示枠の幅を調整
	 */
	private adjustContainerWidth(diagram: HTMLElement) {
		const parent = diagram.parentElement;
		if (!parent) return;

		// 編集ビューの場合
		if (parent.className.includes('cm-preview-code-block')) {
			this.adjustEditingViewWidth(parent);
			return;
		}

		// リーディングビューの場合（wrapper使用）
		if (parent.classList.contains('mermaid-wrapper')) {
			this.adjustReadingViewWidth(parent);
			return;
		}
	}

	/**
	 * 編集ビューの表示枠調整
	 */
	private adjustEditingViewWidth(container: HTMLElement) {
		// 既存のクラスを削除
		container.classList.remove('mermaid-container-custom');
		container.classList.remove('mermaid-container-fullwidth');

		switch (this.settings.containerWidthMode) {
			case 'auto':
				container.style.width = '';
				container.style.maxWidth = '';
				container.style.overflow = '';
				break;
				
			case 'custom':
				container.classList.add('mermaid-container-custom');
				container.style.width = `${this.settings.customWidth}px`;
				container.style.maxWidth = `${this.settings.customWidth}px`;
				container.style.overflow = 'auto';
				break;
				
			case 'fullwidth':
				container.classList.add('mermaid-container-fullwidth');
				container.style.width = '100%';
				container.style.maxWidth = '100%';
				container.style.overflow = 'auto';
				break;
		}
	}

	/**
	 * リーディングビューの表示枠調整
	 */
	private adjustReadingViewWidth(wrapper: HTMLElement) {
		// 既存のクラスを削除
		wrapper.classList.remove('mermaid-wrapper-custom');
		wrapper.classList.remove('mermaid-wrapper-fullwidth');

		switch (this.settings.containerWidthMode) {
			case 'auto':
				wrapper.style.width = '100%';
				wrapper.style.maxWidth = '';
				break;
				
			case 'custom':
				wrapper.classList.add('mermaid-wrapper-custom');
				wrapper.style.width = `${this.settings.customWidth}px`;
				wrapper.style.maxWidth = `${this.settings.customWidth}px`;
				break;
				
			case 'fullwidth':
				wrapper.classList.add('mermaid-wrapper-fullwidth');
				wrapper.style.width = '100%';
				wrapper.style.maxWidth = '100%';
				break;
		}
	}

	/**
	 * 既存のイベントリスナーをクリア
	 */
	private clearExistingListeners(element: HTMLElement): HTMLElement {
		const newElement = element.cloneNode(true) as HTMLElement;
		element.parentNode?.replaceChild(newElement, element);
		return newElement;
	}

	/**
	 * 全ての図表をリセット
	 */
	private resetAllDiagrams() {
		const diagrams = document.querySelectorAll('.mermaid[data-zoom-enhanced]');
		diagrams.forEach((diagram) => {
			const element = diagram as HTMLElement;
			
			// スタイルをリセット
			element.style.transform = '';
			element.style.transition = '';
			
			// CSSクラスを削除
			element.classList.remove('is-dragging');
			element.removeAttribute('data-zoom-enhanced');
			
			// 親要素の処理
			const parent = element.parentElement;
			if (parent) {
				// 編集ビューの場合
				if (parent.className.includes('cm-preview-code-block')) {
					parent.style.width = '';
					parent.style.maxWidth = '';
					parent.style.overflow = '';
					parent.classList.remove('mermaid-container-custom');
					parent.classList.remove('mermaid-container-fullwidth');
				}
				// リーディングビューのwrapper の場合
				else if (parent.classList.contains('mermaid-wrapper')) {
					const grandParent = parent.parentElement;
					if (grandParent) {
						// wrapperを削除して図表を元の位置に戻す
						grandParent.insertBefore(element, parent);
						grandParent.removeChild(parent);
					}
				}
			}
		});
	}
}