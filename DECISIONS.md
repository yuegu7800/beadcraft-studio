# Architecture Decisions

1. 使用 Vite + 原生 TypeScript + Canvas，避免大型框架和运行时依赖。
2. 核心图像转换、编辑与导出全部浏览器本地执行，不上传原图，不使用 API。
3. 色彩匹配采用预计算 LAB + CIEDE2000；未确认官方完整 MARD 数据前仅内置明确标记的 DEMO palette，并支持 CSV 导入。
4. 用同一份不可变 grid 派生图纸、统计、导出和四类产品预览，避免预览间形状漂移。
5. 视觉采用冷白工作台、炭黑文字、珊瑚红单一强调色；原生 CSS 变量同时支持系统深色模式。
