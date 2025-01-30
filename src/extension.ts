// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "deepseek-chat" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    'deepseek-chat.deepseekChat',
    () => {
      const panel = vscode.window.createWebviewPanel(
        'deepChat',
        'DeepSeek Chat',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === 'chat') {
          const userPrompt = message.messageValue;
          let responseText = '';

          try {
            const streamResponse = await ollama.chat({
              model: 'deepseek-r1',
              messages: [{ role: 'user', content: userPrompt }],
              stream: true,
            });

            for await (const response of streamResponse) {
              responseText += response.message.content;
              panel.webview.postMessage({
                command: 'chatResponse',
                text: responseText,
              });
            }
          } catch (error) {
            panel.webview.postMessage({
              command: 'chatResponse',
              text: `Error: ${String(error)}`,
            });
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

const getWebviewContent = () => {
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; padding: 20px;">
    <textarea placeholder='Ask me anything...' id="message" style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;"></textarea>
    <br>
    <button id='askBtn' style="margin-top: 10px; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Ask</button>
    <p id="response" style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; min-height: 20px;"></p>
    <script>
      const vscode = acquireVsCodeApi();
      const message = document.getElementById('message');
      const response = document.getElementById('response');

      document.getElementById('askBtn').addEventListener('click', () => {
        const messageValue = message.value;
        if (!messageValue) {
          return;
        }

        response.innerText = 'Sending...';
        vscode.postMessage({ command: 'chat', messageValue });
      });

      window.addEventListener('message', event => {
        const {command, text} = event.data;
        if(command === 'chatResponse') {
          response.innerText = text;
        }
      });
    </script>
  </body>
  </html>`;
};

// This method is called when your extension is deactivated
export function deactivate() {}
