const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const https = require('https');

const axios = require('axios');


const app = express();
const PORT = process.env.PORT || 3000;

// 配置中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// 设置视图引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 文件数据路径
const DATA_PATH = path.join(__dirname, 'data', 'files.json');
const CONFIG_PATH = path.join(__dirname, 'data', 'config.json');

// 初始化文件数据
function initData() {
  if (!fs.existsSync(path.dirname(DATA_PATH))) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  }
  
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 2));
  }
}

// 读取文件数据 - 修复版本
function readFiles() {
  try {
    // 检查文件是否存在
    if (!fs.existsSync(DATA_PATH)) {
      return [];
    }
    
    // 读取文件内容
    const data = fs.readFileSync(DATA_PATH, 'utf8');
    
    // 处理空文件情况
    if (!data.trim()) {
      return [];
    }
    
    return JSON.parse(data);
  } catch (err) {
    console.error('读取文件错误:', err);
    return [];
  }
}

// 保存文件数据
function saveFiles(files) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(files, null, 2));
}

// 读取配置
function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ loginKey: 'denglu' }, null, 2));
  }
  const data = fs.readFileSync(CONFIG_PATH, 'utf8');
  return JSON.parse(data);
}

// 保存配置
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// 初始化配置
const config = readConfig();
let LOGIN_KEY = config.loginKey;

// 读取推送地址配置
const POST_URLS = config.postUrls || {};
// POST
// 在修改文件中fileName是旧文件名，newfileName是新文件名
// 添加和删除文件中fileName是文件名
// 例：
// 删除了文件：[${body.fileName}]
// 添加了文件：[${body.fileName}]
// ${body.fileName}${body.newfileName}



function sendPush(url, label = '', fileName = '', newfileName = '') {
  if (!url) {
    console.warn(`未配置 ${label} 通知 URL`);
    return;
  }
  axios.post(url, { fileName, newfileName, label })
    .then(res => console.log(`[${label}] 通知成功: ${res.status}`))
    .catch(err => console.error(`[${label}] 通知失败:`, err.message));
}



// 路由处理
app.get('/', (req, res) => {
  const files = readFiles();
  res.render('index', { files });
});

// 登录路由 - 传递 error 变量
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { key } = req.body;
  
  if (key === LOGIN_KEY) {
    req.session.isLoggedIn = true;
    res.redirect('/admin');
  } else {
    res.render('login', { error: '无效的登录密钥' });
  }
});

app.get('/admin', (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect('/login');
  }
  
  const files = readFiles();
  res.render('admin', { files, POST_URLS });
});

// 添加退出路由
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});



app.post('/add-file', (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.status(401).send('未授权');
  }
  const { name, links, icon } = req.body;
  const files = readFiles();
  const newFile = {
    id: Date.now().toString(),
    name,
    links: links
      .split('\n')
      .map(line => {
        const [label, url] = line.split('|').map(s => s.trim());
        return { label: label || '链接', url };
      })
      .filter(link => link.url),
    icon: icon || ''
  };
  files.push(newFile);
  saveFiles(files);
  //sendupfile(); // 发送文件添加通知
  sendPush(POST_URLS.fileAdd, '添加文件', newFile.name);
  res.redirect('/admin');
});

app.post('/update-file/:id', (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.status(401).send('未授权');
  }
  const { id } = req.params;
  const { name, links, icon } = req.body;
  const files = readFiles();
  const fileIndex = files.findIndex(file => file.id === id);
  if (fileIndex !== -1) {
    const oldName = files[fileIndex].name;
    const oldLinks = files[fileIndex].links ? JSON.parse(JSON.stringify(files[fileIndex].links)) : [];
    files[fileIndex].name = name;
    files[fileIndex].links = links
      .split('\n')
      .map(line => {
        const [label, url] = line.split('|').map(s => s.trim());
        return { label: label || '链接', url };
      })
      .filter(link => link.url);
    files[fileIndex].icon = icon || '';
    saveFiles(files);

    // 检查下载地址是否有变化
    const newLinks = files[fileIndex].links;
    const oldLinksStr = JSON.stringify(oldLinks);
    const newLinksStr = JSON.stringify(newLinks);
    if (oldLinksStr !== newLinksStr) {
      
      // 下载地址有变化，发送通知
      sendPush(
        POST_URLS.fileEdit,
        '编辑文件下载地址',
        '文件：['+name + ']地址已变更'
      );
    } else {
      // 仅名称或图标变化
      sendPush(
        POST_URLS.fileEdit,
        '编辑文件',
        '文件：['+oldName + ']新名称为',
        '：['+name + ']'
      );
    }
  }
  res.redirect('/admin');
});

app.get('/delete-file/:id', (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.status(401).send('未授权');
  }
  
  const { id } = req.params;
  let files = readFiles();
  const deletedFile = files.find(file => file.id === id); // 先获取被删文件
  files = files.filter(file => file.id !== id);
  saveFiles(files);
  sendPush(POST_URLS.fileDelete, '删除文件', deletedFile ? deletedFile.name : '');
  res.redirect('/admin');
});

// 密钥接口
app.post('/change-login-key', (req, res) => {
  if (!req.session.isLoggedIn) return res.status(403).json({ message: '未授权' });
  const { newKey } = req.body;
  if (!newKey || typeof newKey !== 'string' || !newKey.trim()) {
    return res.status(400).json({ message: '密钥不能为空' });
  }
  LOGIN_KEY = newKey.trim();
  const config = readConfig();
  config.loginKey = LOGIN_KEY;
  saveConfig(config);
  res.json({ message: '登录密钥已修改' });
});

// 新增：推送地址编辑接口
app.post('/update-push-urls', (req, res) => {
  if (!req.session.isLoggedIn) return res.status(403).json({ message: '未授权' });
  const { fileAdd, fileEdit, fileDelete } = req.body;
  const config = readConfig();
  config.postUrls = {
    fileAdd: fileAdd || '',
    fileEdit: fileEdit || '',
    fileDelete: fileDelete || ''
  };
  saveConfig(config);
  // 更新内存中的 POST_URLS
  POST_URLS.fileAdd = fileAdd || '';
  POST_URLS.fileEdit = fileEdit || '';
  POST_URLS.fileDelete = fileDelete || '';
  res.json({ message: '推送地址已保存' });
});

// 初始化并启动服务器
initData();
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});