# 日序

一个无需账号、数据保存在设备本地、支持离线安装的个人日常事项安排 PWA。

## 本地运行与安装

1. 右键 `start.ps1`，选择“使用 PowerShell 运行”。
2. 浏览器打开后，点击左侧的“安装到本机”；也可以点击 Chrome / Edge 地址栏右侧的安装图标。
3. 首次加载后支持离线使用。事项默认只保存在当前浏览器中，建议定期使用“导出备份”。

若 PowerShell 阻止双击运行，可在本目录打开 PowerShell，执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

然后访问 `http://localhost:4173`。

## Android APK

仓库会通过 GitHub Actions 自动构建可直接安装的 Android APK。前往 Releases 页面，下载最新版本中的 `rixu-android.apk`。
