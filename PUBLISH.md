# 发布到 GitHub

当前环境尚未登录 GitHub，因此 MVP、Git 历史和部署工作流已在本地准备完成，发布没有阻塞项目本身。

## 推荐方式

在项目目录执行：

```bash
gh auth login
gh repo create beadcraft-studio --public --source=. --remote=origin --push
```

然后打开 GitHub 仓库：

1. 进入 Settings > Pages。
2. 在 Build and deployment 中把 Source 设为 GitHub Actions。
3. 回到 Actions，等待 Deploy to GitHub Pages 完成。
4. 网站地址通常是 `https://<你的用户名>.github.io/beadcraft-studio/`。

## 已有同名仓库时

不要覆盖现有仓库。先确认新仓库地址，再执行：

```bash
git remote add origin https://github.com/<你的用户名>/<新仓库名>.git
git push -u origin main
```

## 发布前检查

```bash
npm test
npm run build
git status
git log --oneline -10
```

项目不需要 API Key，也不应提交 `.env`、个人图片、Cookies 或任何 Token。
