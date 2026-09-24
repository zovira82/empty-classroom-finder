# Empty Classroom Finder

静态网页按周次、星期、节次、校区、教学楼、容量和关键词查询空教室。

数据规则：`ISTK=4` 是学校课表组件定义的“借用”，查询时不计为占用。其他课表类型（调课、考务、上课、屏蔽）计为占用。

## 本地预览

在本目录运行：

```powershell
python -m http.server 8080
```

然后打开 `http://localhost:8080/`。

## GitHub Pages

仓库包含 `.github/workflows/deploy-pages.yml`。推送到 `main` 分支并在仓库的
**Settings → Pages → Build and deployment** 中选择 **GitHub Actions** 后，网站会自动发布。

## 更新数据

`collect-ynu.js` 需要在已经登录的云南大学“教室课程表”页面上下文中运行。脚本会直接调用列表与整学期课表接口，完成后下载 `classrooms.json`。将该文件替换到 `data/classrooms.json` 后刷新网页。
