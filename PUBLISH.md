# GitHub 发布与维护

项目已经发布：

- 仓库：https://github.com/yuegu7800/beadcraft-studio
- 网站：https://yuegu7800.github.io/beadcraft-studio/
- 二维码：`public/beadcraft-studio-qr.png`
- 部署方式：GitHub Actions + GitHub Pages

桌面的 `BeadCraft Studio` 快捷方式应直接打开线上网站，不需要启动本地 Node.js 服务。

## 推送后续更新

在项目目录执行：

```bash
git push origin main
```

推送到 `main` 后，`.github/workflows/deploy.yml` 会自动运行测试、构建并更新在线网站。

## 发布前检查

```bash
npm test
npm run build
git status
git log --oneline -10
```

项目不需要 API Key，也不应提交 `.env`、个人图片、Cookies 或任何 Token。
