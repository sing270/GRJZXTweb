const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON 数据
app.use(bodyParser.json());

// 允许跨域请求
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 存储数据的文件路径
const dataFilePath = './financialRecords.json';

// 读取文件数据
function readRecords() {
  try {
    if (fs.existsSync(dataFilePath)) {
      return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    }
    return [];
  } catch (err) {
    console.error('读取文件失败:', err);
    return [];
  }
}

// 写入文件数据
function writeRecords(records) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(records, null, 2), 'utf8');
  } catch (err) {
    console.error('写入文件失败:', err);
  }
}

// 修改API接口
app.get('/api/records', (req, res) => {
  res.json(readRecords());
});

app.post('/api/records', (req, res) => {
  const records = readRecords();
  records.push(req.body);
  writeRecords(records);
  res.status(201).json(req.body);
});

// 添加新记录
app.post('/api/records', (req, res) => {
    const newRecord = req.body;
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: '读取数据时出错' });
        }
        const records = JSON.parse(data || '[]');
        records.push(newRecord);
        fs.writeFile(dataFilePath, JSON.stringify(records, null, 2), 'utf8', (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: '保存数据时出错' });
            }
            res.status(201).json(newRecord);
        });
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});
