import './styles.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <header class="topbar">
    <a class="brand" href="#" aria-label="BeadCraft Studio 首页">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span>BeadCraft <b>Studio</b></span>
    </a>
    <div class="top-actions">
      <button class="button button-ghost" type="button">导入工程</button>
      <button class="button button-primary" type="button">导出图纸</button>
    </div>
  </header>
  <main class="workspace-shell">
    <aside class="panel controls-panel">
      <p class="eyebrow">本地创作工具</p>
      <h1>把图片变成<br>真正可做的拼豆图</h1>
      <p class="lede">上传、匹配色号、逐格编辑，再导出清晰图纸。所有处理都留在你的浏览器里。</p>
      <label class="upload-placeholder">
        <input type="file" accept="image/*" disabled>
        <strong>选择一张图片</strong>
        <span>PNG、JPG 或 WebP</span>
      </label>
      <div class="privacy-note"><span aria-hidden="true">✓</span> 图片不会上传服务器</div>
    </aside>
    <section class="canvas-stage" aria-label="拼豆编辑区">
      <div class="empty-canvas">
        <div class="sample-beads" aria-hidden="true">
          ${Array.from({length: 36}, (_, i) => `<i style="--i:${i}"></i>`).join('')}
        </div>
        <h2>从一张喜欢的图片开始</h2>
        <p>图纸会在这里生成，并可逐格修改。</p>
      </div>
    </section>
    <aside class="panel stats-panel">
      <div class="panel-heading"><h2>用豆清单</h2><span>0 色</span></div>
      <div class="empty-stats"><span>生成图纸后，这里会统计每种颜色和数量。</span></div>
    </aside>
  </main>
`;
