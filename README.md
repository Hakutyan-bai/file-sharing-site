# 📁 file-sharing-site

[File Sharing Site](https://github.com/Hakutyan-bai/file-sharing-site) 是一个使用 **Node.js** 开发的轻量级文件分享平台，支持链接聚合、文件展示和多链接下载。支持后台管理，可进行文件链接的添加、修改和删除，可以添加文件图标，同时支持后台密码修改。界面精致，前后端分离，适合希望部署私有分享站点的用户使用。

## ✨ 项目亮点

- 🎨 **美观 UI**：前端使用 Tailwind + React 构建，页面布局清爽优雅  
- 🔗 **多链接聚合**：支持为每个文件配置多个下载地址（如直链、网盘等）  
- 🛠️ **后端管理接口**：可管理文件名称、描述、下载链接（支持 JSON 配置）  
- 📦 **无上传功能**：仅作为展示与链接分发平台，数据安全可控  
---
## 🧩 使用场景

- 📁 部署一个私人文件工具页，聚合常用资源  
- 📝 分享课程资料、项目文档或软件安装包  
- 🛸 提供多个下载镜像/跳转链接入口（如直链 + GitHub + 蓝奏云）  
- 🌍 用于展示文件列表和介绍，替代传统网盘页面  



---

## 🏠 主页展示

![主页](imgs/1.png "主页")

---

## 🛠️ 管理页面展示

![管理页](imgs/2.png "管理页")

---

## ✏️ 编辑页面展示

![编辑](imgs/3.png "编辑")

---

## 🚀 项目部署

### 📦 安装依赖

```bash
npm install express express-session body-parser ejs
```

### ▶️ 启动服务器

```bash
node app.js
```

---

## 📚 项目地址

- GitHub 项目主页：[https://github.com/beilunyang/moepush](https://github.com/beilunyang/moepush)

如果你也觉得这个项目有趣又实用，不妨 Star 一下支持作者！

 本项目适合入门练习，界面简洁，功能实用。如需增加权限分级等，可自行扩展。