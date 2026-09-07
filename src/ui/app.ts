import { renderPattern, DEFAULT_RENDER_OPTIONS, type RenderMetrics, type RenderOptions } from '../canvas/renderer';
import { decodeImageFile, rasterizeImage, type DecodedImage } from '../core/image';
import { DEMO_PALETTE, parsePaletteCsv } from '../core/palette';
import { countBeads, createPattern, getPatternStats } from '../core/pattern';
import { calculateGridSize } from '../core/resize';
import type { BeadPattern, Palette, PatternSettings } from '../types';

const template = `
  <header class="topbar">
    <button class="brand" id="new-project" type="button" aria-label="新建工程"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>BeadCraft <b>Studio</b></span></button>
    <div class="top-actions"><label class="button button-ghost file-button" for="project-input">导入工程</label><input id="project-input" type="file" accept="application/json,.json" hidden><button class="button button-primary" id="export-button" type="button" disabled>导出图纸</button></div>
  </header>
  <main class="workspace-shell">
    <aside class="panel controls-panel">
      <div class="intro-copy"><p class="eyebrow">本地拼豆工作台</p><h1>图片进来，<br>图纸带走</h1><p class="lede">匹配色号、逐格调整，导出一份真正能照着做的拼豆图。</p></div>
      <label class="upload-zone" id="upload-zone" for="image-input"><input id="image-input" type="file" accept="image/png,image/jpeg,image/webp"><span class="upload-icon" aria-hidden="true">＋</span><strong>选择或拖入图片</strong><span>PNG、JPG、WebP，最大 20 MB</span></label>
      <div class="privacy-note"><span aria-hidden="true">✓</span> 图片只在当前浏览器中处理</div>
      <form class="settings" id="settings-form">
        <div class="section-title"><h2>图纸设置</h2><button type="button" class="text-button" id="reset-settings">恢复默认</button></div>
        <label class="field"><span>长边格数</span><div class="range-row"><input id="long-edge" type="range" min="8" max="160" step="1" value="48"><output id="long-edge-value">48</output></div></label>
        <div class="field-grid">
          <label class="field"><span>最多颜色</span><select id="max-colors"><option value="6">6 色</option><option value="8">8 色</option><option value="12" selected>12 色</option><option value="16">16 色</option><option value="18">18 色</option><option value="24">24 色</option><option value="all">不限</option></select></label>
          <label class="field"><span>图片适配</span><select id="fit"><option value="contain">完整保留</option><option value="cover">铺满裁边</option></select></label>
          <label class="field"><span>处理方式</span><select id="process"><option value="original">原始</option><option value="contrast">增强对比</option><option value="soft">柔和</option><option value="cartoon">卡通近似</option></select></label>
          <label class="field"><span>背景</span><select id="background"><option value="keep">保留</option><option value="transparent">透明</option><option value="white">白色</option><option value="custom">自定义</option></select></label>
        </div>
        <label class="field color-field" id="background-color-field" hidden><span>背景颜色</span><input id="background-color" type="color" value="#FFFFFF"></label>
        <div class="palette-row"><div><strong id="palette-name">MARD 兼容 DEMO 32 色</strong><span id="palette-note">非官方色卡，仅供演示</span></div><label class="text-button" for="palette-input">导入 CSV</label><input id="palette-input" type="file" accept="text/csv,.csv" hidden></div>
      </form>
    </aside>
    <section class="canvas-column">
      <div class="canvas-toolbar"><div class="segmented" aria-label="视图选择"><button type="button" data-view="pattern" class="active">拼豆图</button><button type="button" data-view="original">原图</button></div><div class="toolbar-options"><label><input id="show-grid" type="checkbox" checked> 网格</label><label><input id="show-codes" type="checkbox"> 色号</label><select id="zoom" aria-label="缩放"><option value="0.5">50%</option><option value="0.75">75%</option><option value="1" selected>100%</option><option value="1.5">150%</option><option value="2">200%</option></select></div></div>
      <div class="tool-strip" id="tool-strip" aria-label="编辑工具"><button type="button" data-tool="paint" class="active" disabled>改色</button><button type="button" data-tool="erase" disabled>擦除</button><button type="button" data-tool="picker" disabled>吸色</button><span class="tool-divider"></span><button type="button" id="undo" disabled>撤销</button><button type="button" id="redo" disabled>重做</button><span class="status-text" id="status-text">等待图片</span></div>
      <div class="canvas-stage" id="canvas-stage"><div class="empty-canvas" id="empty-canvas"><div class="sample-beads" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div><h2>从一张喜欢的图片开始</h2><p>拖入图片，几秒内得到可编辑图纸。</p><label class="button button-primary empty-cta" for="image-input">选择图片</label></div><div class="loading-state" id="loading-state" hidden><div class="loading-grid"></div><strong>正在匹配拼豆颜色</strong></div><canvas id="pattern-canvas" hidden></canvas><canvas id="source-canvas" hidden></canvas><div class="cell-tooltip" id="cell-tooltip" hidden></div></div>
    </section>
    <aside class="panel stats-panel"><div class="panel-heading"><h2>用豆清单</h2><select id="stats-sort" aria-label="清单排序"><option value="count">按数量</option><option value="code">按色号</option></select></div><div class="metrics" id="metrics"><div><span>图纸</span><strong>0 × 0</strong></div><div><span>豆子</span><strong>0</strong></div><div><span>颜色</span><strong>0</strong></div></div><div class="empty-stats" id="empty-stats">生成图纸后，这里会精确统计每种颜色。</div><div class="stat-list" id="stat-list"></div><button class="button button-wide button-ghost" id="preview-button" type="button" disabled>查看产品预览</button></aside>
  </main><div class="toast" id="toast" role="status" aria-live="polite" hidden></div>`;

const DEFAULT_SETTINGS: PatternSettings = { longEdge: 48, maxColors: 12, fit: 'contain', background: 'keep', backgroundColor: '#FFFFFF', process: 'original' };

export class BeadCraftApp {
  private decoded: DecodedImage | null = null;
  private pattern: BeadPattern | null = null;
  private palette: Palette = DEMO_PALETTE;
  private settings: PatternSettings = { ...DEFAULT_SETTINGS };
  private renderOptions: RenderOptions = { ...DEFAULT_RENDER_OPTIONS };
  private metrics: RenderMetrics | null = null;
  private sourceFileName = '';
  private view: 'pattern' | 'original' = 'pattern';
  private sort: 'count' | 'code' = 'count';
  private processTicket = 0;

  constructor(private root: HTMLElement) { root.innerHTML = template; this.bindEvents(); }
  private element<T extends HTMLElement>(selector: string): T { const found = this.root.querySelector<T>(selector); if (!found) throw new Error(`缺少界面元素：${selector}`); return found; }

  private bindEvents(): void {
    const imageInput = this.element<HTMLInputElement>('#image-input');
    imageInput.addEventListener('change', () => this.openImage(imageInput.files?.[0]));
    const uploadZone = this.element<HTMLElement>('#upload-zone');
    uploadZone.addEventListener('dragover', (event) => { event.preventDefault(); uploadZone.classList.add('dragging'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragging'));
    uploadZone.addEventListener('drop', (event) => { event.preventDefault(); uploadZone.classList.remove('dragging'); this.openImage(event.dataTransfer?.files[0]); });
    this.element<HTMLInputElement>('#long-edge').addEventListener('input', (event) => { const value = Number((event.target as HTMLInputElement).value); this.element<HTMLOutputElement>('#long-edge-value').value = String(value); this.settings.longEdge = value; this.scheduleProcess(); });
    this.bindSettingSelect('#max-colors', (value) => this.settings.maxColors = value === 'all' ? null : Number(value));
    this.bindSettingSelect('#fit', (value) => this.settings.fit = value as PatternSettings['fit']);
    this.bindSettingSelect('#process', (value) => this.settings.process = value as PatternSettings['process']);
    this.bindSettingSelect('#background', (value) => { this.settings.background = value as PatternSettings['background']; this.element<HTMLElement>('#background-color-field').hidden = value !== 'custom'; });
    this.element<HTMLInputElement>('#background-color').addEventListener('input', (event) => { this.settings.backgroundColor = (event.target as HTMLInputElement).value; this.scheduleProcess(); });
    this.element<HTMLButtonElement>('#reset-settings').addEventListener('click', () => this.resetSettings());
    this.element<HTMLButtonElement>('#new-project').addEventListener('click', () => this.newProject());
    this.element<HTMLInputElement>('#show-grid').addEventListener('change', (event) => { this.renderOptions.showGrid = (event.target as HTMLInputElement).checked; this.render(); });
    this.element<HTMLInputElement>('#show-codes').addEventListener('change', (event) => { this.renderOptions.showCodes = (event.target as HTMLInputElement).checked; this.render(); });
    this.element<HTMLSelectElement>('#zoom').addEventListener('change', (event) => { this.renderOptions.zoom = Number((event.target as HTMLSelectElement).value); this.render(); });
    this.root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => button.addEventListener('click', () => this.setView(button.dataset.view as 'pattern' | 'original')));
    this.element<HTMLSelectElement>('#stats-sort').addEventListener('change', (event) => { this.sort = (event.target as HTMLSelectElement).value as 'count' | 'code'; this.renderStats(); });
    const paletteInput = this.element<HTMLInputElement>('#palette-input');
    paletteInput.addEventListener('change', async () => { const file = paletteInput.files?.[0]; if (!file) return; try { this.palette = parsePaletteCsv(await file.text(), file.name.replace(/\.csv$/i, '')); this.renderPaletteInfo(); await this.processImage(); this.showToast(`已导入 ${this.palette.colors.length} 种颜色`); } catch (error) { this.showError(error); } paletteInput.value = ''; });
  }
  private bindSettingSelect(selector: string, update: (value: string) => void): void { this.element<HTMLSelectElement>(selector).addEventListener('change', (event) => { update((event.target as HTMLSelectElement).value); this.scheduleProcess(); }); }
  private async openImage(file?: File): Promise<void> {
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) return this.showToast('图片不能超过 20 MB');
    try { this.setBusy(true, '正在读取图片'); this.decoded?.dispose(); this.decoded = await decodeImageFile(file); this.sourceFileName = file.name; await this.processImage(); }
    catch (error) { this.setBusy(false); this.showError(error); }
  }
  private scheduleProcess(): void { if (!this.decoded) return; const ticket = ++this.processTicket; window.setTimeout(() => { if (ticket === this.processTicket) void this.processImage(); }, 180); }
  private async processImage(): Promise<void> {
    if (!this.decoded) return;
    const ticket = ++this.processTicket; this.setBusy(true, '正在匹配拼豆颜色'); await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (ticket !== this.processTicket || !this.decoded) return;
    try { const size = calculateGridSize(this.decoded.width, this.decoded.height, this.settings.longEdge); const imageData = rasterizeImage(this.decoded, size.width, size.height, this.settings.fit, this.settings.background, this.settings.backgroundColor, this.settings.process); this.pattern = createPattern(imageData, this.palette, this.settings); this.drawSource(); this.setBusy(false); this.setView('pattern'); this.render(); this.enableProjectActions(true); this.element<HTMLElement>('#status-text').textContent = `${this.sourceFileName} 已生成`; }
    catch (error) { this.setBusy(false); this.showError(error); }
  }
  private drawSource(): void { if (!this.decoded) return; const canvas = this.element<HTMLCanvasElement>('#source-canvas'); const scale = Math.min(1, 900 / Math.max(this.decoded.width, this.decoded.height)); canvas.width = Math.round(this.decoded.width * scale); canvas.height = Math.round(this.decoded.height * scale); canvas.style.width = `${Math.round(canvas.width * this.renderOptions.zoom)}px`; canvas.style.height = `${Math.round(canvas.height * this.renderOptions.zoom)}px`; canvas.getContext('2d')?.drawImage(this.decoded.source, 0, 0, canvas.width, canvas.height); }
  private render(): void { if (!this.pattern) return; const canvas = this.element<HTMLCanvasElement>('#pattern-canvas'); this.metrics = renderPattern(canvas, this.pattern, this.palette, this.renderOptions); this.drawSource(); canvas.hidden = this.view !== 'pattern'; this.element<HTMLCanvasElement>('#source-canvas').hidden = this.view !== 'original'; this.renderStats(); }
  private renderStats(): void {
    if (!this.pattern) return;
    const stats = getPatternStats(this.pattern, this.palette); stats.sort(this.sort === 'count' ? (a, b) => b.count - a.count : (a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const metrics = this.element<HTMLElement>('#metrics').querySelectorAll('strong'); metrics[0]!.textContent = `${this.pattern.width} × ${this.pattern.height}`; metrics[1]!.textContent = countBeads(this.pattern).toLocaleString('zh-CN'); metrics[2]!.textContent = String(stats.length);
    this.element<HTMLElement>('#empty-stats').hidden = true;
    this.element<HTMLElement>('#stat-list').innerHTML = stats.map((stat) => `<button class="stat-row" type="button" data-code="${this.escape(stat.code)}" title="高亮 ${this.escape(stat.code)}"><span class="swatch" style="background:${stat.hex}"></span><span class="stat-name"><strong>${this.escape(stat.code)}</strong><small>${this.escape(stat.name)}</small></span><span class="stat-count"><strong>${stat.count}</strong><small>${stat.percent.toFixed(1)}%</small></span></button>`).join('');
    this.root.querySelectorAll<HTMLButtonElement>('.stat-row').forEach((row) => row.addEventListener('click', () => { const code = row.dataset.code ?? null; this.renderOptions.highlightCode = this.renderOptions.highlightCode === code ? null : code; this.root.querySelectorAll('.stat-row').forEach((item) => item.classList.toggle('selected', item === row && this.renderOptions.highlightCode === code)); this.render(); }));
  }
  private setView(view: 'pattern' | 'original'): void { this.view = view; this.root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view)); if (this.pattern) this.render(); }
  private setBusy(busy: boolean, label = ''): void { this.element<HTMLElement>('#loading-state').hidden = !busy; this.element<HTMLElement>('#empty-canvas').hidden = busy || Boolean(this.pattern); if (busy) this.element<HTMLElement>('#loading-state').querySelector('strong')!.textContent = label; }
  private enableProjectActions(enabled: boolean): void { this.element<HTMLButtonElement>('#export-button').disabled = !enabled; this.element<HTMLButtonElement>('#preview-button').disabled = !enabled; this.root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((button) => button.disabled = !enabled); }
  private renderPaletteInfo(): void { this.element<HTMLElement>('#palette-name').textContent = this.palette.name; this.element<HTMLElement>('#palette-note').textContent = this.palette.disclaimer; }
  private resetSettings(): void { this.settings = { ...DEFAULT_SETTINGS }; this.element<HTMLInputElement>('#long-edge').value = '48'; this.element<HTMLOutputElement>('#long-edge-value').value = '48'; this.element<HTMLSelectElement>('#max-colors').value = '12'; this.element<HTMLSelectElement>('#fit').value = 'contain'; this.element<HTMLSelectElement>('#process').value = 'original'; this.element<HTMLSelectElement>('#background').value = 'keep'; this.element<HTMLElement>('#background-color-field').hidden = true; this.scheduleProcess(); }
  private newProject(): void { this.decoded?.dispose(); this.decoded = null; this.pattern = null; this.metrics = null; this.sourceFileName = ''; this.element<HTMLCanvasElement>('#pattern-canvas').hidden = true; this.element<HTMLCanvasElement>('#source-canvas').hidden = true; this.element<HTMLElement>('#empty-canvas').hidden = false; this.element<HTMLElement>('#empty-stats').hidden = false; this.element<HTMLElement>('#stat-list').innerHTML = ''; this.element<HTMLElement>('#status-text').textContent = '等待图片'; this.enableProjectActions(false); }
  private showError(error: unknown): void { this.showToast(error instanceof Error ? error.message : '处理失败，请换一张图片重试'); }
  private showToast(message: string): void { const toast = this.element<HTMLElement>('#toast'); toast.textContent = message; toast.hidden = false; window.setTimeout(() => toast.hidden = true, 2800); }
  private escape(value: string): string { return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]!); }
}
