# Chlamydomonos的酒馆临时SGP Claude3代理

这是一个反向代理服务端，用于把Sourcegraph Cody的Claude 3模型接口转换为酒馆可用的OpenAI格式。

## 用法

* 保证电脑上有[Node.js](https://nodejs.org)。
* 编辑`config.hjson`，确定使用的模型以及代理运行的端口。
* 运行`start.bat`启动服务端。（也可手动运行`npm install`及`npm start`启动）
* 打开酒馆，设置Proxy Server URL为`http://127.0.0.1:<你设置的端口>/v1`，Proxy Password为你的SGP Access Token。
* 设置聊天补全源为OpenAI，此时任意模型都对应你在`config.hjson`中选择的模型。
* 完成以上设置后，理论上应该可以正常使用。