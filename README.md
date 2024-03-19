# Chlamydomonos的酒馆临时SGP Claude3代理

这是一个反向代理服务端，用于把Sourcegraph Cody的Claude 3模型接口转换为酒馆可用的OpenAI格式。

## 用法

* 保证电脑上有[Node.js](https://nodejs.org)。
* 编辑`config.hjson`，确定使用的模型以及代理运行的端口。
* 运行`start.bat`启动服务端。（也可手动运行`npm install`及`npm start`启动）
* 打开酒馆，设置Proxy Server URL为`http://127.0.0.1:<你设置的端口>/v1`，Proxy Password为你的SGP Access Token。
* 设置聊天补全源为OpenAI，并勾选Show "External" models (provided by API)，在模型列表中找到`claude-3`并选择。
* 完成以上设置后，理论上应该可以正常使用。

## 注意事项

* Sourcegraph的Claude 3接口有如下限制：
  * 请求的第一条必须是system prompt（即`role`为`system`的消息）。
  * System prompt只能是第一条消息，对话记录中不能有其他system prompt。
  * 从system prompt之后，每条消息的`role`必须由`user`和`assistant`交替出现。
  * 请求的最后一条消息`role`必须是`user`。

  因此，本反向代理采取以下方式处理酒馆发来的请求：
  * 如果请求没有system prompt，则插入一条空白的system prompt。
  * 如果请求的开头有多条system prompt，则把它们合并，之间用`\n\n`分隔。
  * 如果请求的其他部分有system prompt，把其`role`转为`user`。
  * 如果请求中有连续多条由`user`或`assistant`发送的消息，同样把它们合并，中间用`\n\n`分隔。
  * 如果请求的最后一条消息的`role`是`assistant`，则再追加一条`role`为`user`的消息，内容固定为`[Start conversation]`。
* 目前已经发现了Sourcegraph对请求的一条过滤机制：若请求的system prompt不以`You are Cody`开头且请求中含有字符串`查看上文后分两次回复`，这条请求会被视为非法请求。
  本反向代理目前采用此方法规避这条机制：一旦发现`查看上文后分两次回复`处于请求中，自动在system prompt的开头加上`You are Cody`。
* Sourcegraph仍然可能会对请求做出其他限制，本反向代理目前还未发现。如果服务端无法正常访问Sourcegraph服务器，会在控制台输出`error calling sgp`。此时可以在`config.hjson`中把`verboseError`设为`true`来查看更多信息。