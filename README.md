# English Log · 每日英文日记

一个单文件网页小工具（`index.html`），手机浏览器打开即可用：每天用英文写（或用 iPhone 键盘麦克风口述）一段日记，点 **Check with DeepSeek** 得到自然口语版本，每条修改按「你的句子 → 自然说法 → 原因 → 另一种说法」展示，保存后可在 **History** 里回看进度（篇数、连续天数、每 100 词修改数：最近 7 篇 vs 更早）。

在线地址：https://benjaminxu2023-glitch.github.io/english-log/

## 数据与隐私
- **日记只存在当前浏览器**（localStorage），不上传到任何服务器。清除浏览器数据或换手机会丢失，请定期在 History 页点 **Export** 导出 JSON 备份，用 **Import** 恢复。
- **DeepSeek API Key 只存在本机浏览器**，在 Settings 页粘贴、可随时 Clear。代码里不含任何密钥，导出文件也不含密钥。
- 点 **Check** 时，日记文字会发送到 DeepSeek（api.deepseek.com）处理；费用从你自己的 DeepSeek 余额扣，每次大约几百 tokens。
- 没有 Key、断网、Key 无效（401）、余额不足（402）时会提示，原文照样可以保存。

## 测试
```
node --test tests/
```
