# mcp-server-wrike

[![npm version](https://badge.fury.io/js/mcp-server-wrike.svg)](https://www.npmjs.com/package/mcp-server-wrike)

[English](#english) | [日本語](#japanese)

<a id="english"></a>

## English

Model Context Protocol (MCP) server implementation for Wrike. This package allows you to talk to the Wrike API from MCP clients such as Anthropic's Claude Desktop Application and other MCP-compatible tools.

### About MCP

More details on MCP here:
- [Anthropic's Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [MCP Documentation](https://modelcontextprotocol.io/introduction)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)

### Usage

In your AI tool of choice (e.g., Claude Desktop), ask something about Wrike tasks, projects, spaces, and/or comments. Mentioning the word "wrike" will increase the chance of having the LLM pick the right tool.

Example:
> How many unfinished wrike tasks do we have in our Sprint 30 project?

### Available Functions

1. `wrike_list_spaces`
   - List all available spaces in Wrike
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of spaces

2. `wrike_create_folder`
   - Create a new folder in Wrike
   - Required input:
     - `parent_id` (string): ID of the parent folder
     - `title` (string): Title of the folder
   - Optional input:
     - `description` (string): Description of the folder
     - `shareds` (array of strings): Array of user IDs to share the folder with
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: Created folder information

3. `wrike_search_projects`
   - Search for projects in Wrike using name pattern matching
   - Required input:
     - `space_id` (string): The space to search in
     - `name_pattern` (string): Regular expression pattern to match project names
   - Optional input:
     - `archived` (boolean): Only return archived projects (default: false)
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of matching projects

3. `wrike_search_tasks`
   - Search tasks with advanced filtering options
   - Required input:
     - `folder_id` (string): The folder/project to search in
   - Optional input:
     - `title` (string): Text to search for in task titles
     - `status` (string): Filter by task status
     - `importance` (string): Filter by task importance
     - `completed` (boolean): Filter for completed tasks
     - `subtasks` (boolean): Filter for subtasks
     - `opt_fields` (string): Comma-separated list of optional fields to include
     - `custom_fields` (object): Object containing custom field filters
   - Returns: List of matching tasks

4. `wrike_get_task`
   - Get detailed information about a specific task
   - Required input:
     - `task_id` (string): The task ID to retrieve
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: Detailed task information

5. `wrike_create_task`
   - Create a new task in a project
   - Required input:
     - `folder_id` (string): The folder/project to create the task in
     - `title` (string): Title of the task
   - Optional input:
     - `description` (string): Description of the task
     - `status` (string): Status of the task
     - `importance` (string): Importance of the task
     - `dates` (object): Due dates for the task
     - `assignees` (array of strings): Array of user IDs to assign to the task
     - `followers` (array of strings): Array of user IDs to add as followers
     - `parent_id` (string): The parent task ID to set this task under
   - Returns: Created task information

6. `wrike_get_comments`
   - Get comments from Wrike with various filtering options
   - Optional input (at least one is required):
     - `task_id` (string): Get comments for a specific task ID
     - `folder_id` (string): Get comments for a specific folder ID
     - `comment_ids` (array of strings): Get specific comments by IDs (up to 100)
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of comments

7. `wrike_update_task`
   - Update an existing task's details
   - Required input:
     - `task_id` (string): The task ID to update
   - Optional input:
     - `title` (string): New title for the task
     - `description` (string): New description for the task
     - `status` (string): New status for the task
     - `importance` (string): New importance for the task
     - `dates` (object): New due dates for the task
     - `completed` (boolean): Mark task as completed or not
   - Returns: Updated task information

8. `wrike_get_project`
   - Get detailed information about a specific folder/project
   - Required input:
     - `project_id` (string): The project ID to retrieve
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: Detailed project information

9. `wrike_create_comment`
   - Create a comment on a task
   - Required input:
     - `task_id` (string): The task ID to add the comment to
     - `text` (string): The text content of the comment
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: Created comment information

10. `wrike_get_contacts`
    - Get information about Wrike contacts/users
    - Optional input:
      - `me` (boolean): Return only the current user's information
      - `opt_fields` (string): Comma-separated list of optional fields to include
    - Returns: List of contacts

11. `wrike_get_timelogs`
    - Get timelogs from Wrike with filtering options
    - Optional input:
      - `task_id` (string): Filter timelogs by task ID
      - `contact_id` (string): Filter timelogs by contact/user ID
      - `folder_id` (string): Filter timelogs by folder ID
      - `category_id` (string): Filter timelogs by timelog category ID
      - `timelog_ids` (string): Comma-separated list of timelog IDs to retrieve (up to 100)
      - `start_date` (string): Filter timelogs by start date (YYYY-MM-DD)
      - `end_date` (string): Filter timelogs by end date (YYYY-MM-DD)
      - `opt_fields` (string): Comma-separated list of optional fields to include
    - Returns: List of timelogs

12. `echo`
    - Simple echo function for testing
    - Required input:
      - `message` (string): Message to echo back
    - Returns: The same message

### Setup

#### 1. Create a Wrike account
   - Visit [Wrike](https://www.wrike.com/)
   - Click "Sign up"

#### 2. Set up Wrike API Application and Authentication

##### Using a Permanent Token
   - Log in to your Wrike account
   - Go to the [Wrike App Directory](https://www.wrike.com/frontend/apps/index.html#/api)
   - Create a new API application if you don't have one
   - Click "Obtain permanent token" and follow the instructions
   - More details here: [Wrike OAuth 2.0 Authorization](https://developers.wrike.com/oauth-20-authorization/)

#### 3. Install the MCP Server

   ```bash
   # Clone the repository
   git clone https://github.com/katoiek/mcp-server-wrike.git
   cd mcp-server-wrike

   # Install dependencies
   npm install

   # Build the project
   npm run build
   ```

#### 4. Configure the Server
   - Copy the `.env.example` file to `.env` in the project root:
     ```bash
     cp .env.example .env
     ```
   - Edit the `.env` file and update the `WRIKE_ACCESS_TOKEN` with your permanent token

#### 5. Configure Claude Desktop
   Add the following to your `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "wrike-mcp-server": {
      "command": "node",
      "args": ["C:/installed-path/mcp-server-wrike/dist/server.js"],
      "env": {
        "WRIKE_ACCESS_TOKEN": "your-wrike-access-token",
        "WRIKE_HOST": "www.wrike.com",
        "NODE_ENV": "production",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

> **Note**: Replace `C:/path/to/mcp-server-wrike/dist/server.js` with the actual path to the server.js file on your system. Make sure to use forward slashes (/) or escaped backslashes (\\\\) in the path.
```

### Installation

```bash
# Clone the repository
git clone https://github.com/katoiek/mcp-server-wrike.git
cd mcp-server-wrike

# Install dependencies
npm install

# Build the project
npm run build
```

### Troubleshooting

If you encounter permission errors:
1. Ensure your Wrike plan allows API access
2. Confirm the access token is correctly set in `claude_desktop_config.json`
3. Verify that you've copied `.env.example` to `.env` and updated it with your permanent token
4. Check the logs in `%APPDATA%\Claude\logs` on Windows

If tools are not showing up in Claude Desktop:
1. Restart Claude Desktop
2. Ensure the server is properly built with `npm run build`
3. Check that the path to the server.js file is correct in your configuration
4. Verify that both `.env` file and Claude Desktop configuration have the same access token

If you experience performance issues:
1. Set `LOG_LEVEL` to `warn` or `error` in your configuration to reduce logging
2. Check if your system has enough memory available
3. Restart Claude Desktop periodically to clear memory
4. Update to the latest version which includes performance optimizations

### Development

This project is written in TypeScript. Clone this repo and start hacking:

```bash
git clone https://github.com/katoiek/mcp-server-wrike.git
cd mcp-server-wrike
npm install
```

#### Recent Improvements

If you want to test your changes, you can use the MCP Inspector:

```bash
npm run inspector
```

This will expose the client to port `5173` and server to port `3000`.

If those ports are already used by something else, you can use:

```bash
CLIENT_PORT=5009 SERVER_PORT=3009 npm run inspector
```

Alternatively, you can run the inspector directly:

```bash
npx @modelcontextprotocol/inspector
```

### License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.

---

<a id="japanese"></a>

## 日本語

Wrike用のModel Context Protocol (MCP) サーバー実装です。このパッケージを使用すると、AnthropicのClaude Desktopアプリケーションなどの MCP クライアントからWrike APIと対話できます。

### MCPについて

MCPの詳細はこちら：
- [AnthropicのModel Context Protocol](https://www.anthropic.com/news/model-context-protocol)
- [MCPドキュメント](https://modelcontextprotocol.io/introduction)
- [MCP GitHubリポジトリ](https://github.com/modelcontextprotocol)

### 使用方法

お好みのAIツール（Claude Desktopなど）で、Wrikeのタスク、プロジェクト、スペース、コメントについて質問してください。「wrike」という単語を含めると、LLMが適切なツールを選択する可能性が高まります。

例：
> Sprint 30プロジェクトには未完了のwrikeタスクがいくつありますか？

### 利用可能な関数

1. `wrike_list_spaces`
   - Wrikeで利用可能なすべてのスペースをリスト表示
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：スペースのリスト

2. `wrike_create_folder`
   - Wrikeに新しいフォルダを作成
   - 必須入力：
     - `parent_id`（文字列）：親フォルダのID
     - `title`（文字列）：フォルダのタイトル
   - オプション入力：
     - `description`（文字列）：フォルダの説明
     - `shareds`（文字列の配列）：フォルダを共有するユーザーIDの配列
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：作成されたフォルダの情報

3. `wrike_search_projects`
   - 名前パターンマッチングを使用してWrikeのプロジェクトを検索
   - 必須入力：
     - `space_id`（文字列）：検索対象のスペース
     - `name_pattern`（文字列）：プロジェクト名に一致する正規表現パターン
   - オプション入力：
     - `archived`（ブール値）：アーカイブされたプロジェクトのみを返す（デフォルト：false）
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：一致するプロジェクトのリスト

3. `wrike_search_tasks`
   - 高度なフィルタリングオプションでタスクを検索
   - 必須入力：
     - `folder_id`（文字列）：検索対象のフォルダ/プロジェクト
   - オプション入力：
     - `title`（文字列）：タスクタイトルで検索するテキスト
     - `status`（文字列）：タスクステータスでフィルタリング
     - `importance`（文字列）：タスクの重要度でフィルタリング
     - `completed`（ブール値）：完了したタスクでフィルタリング
     - `subtasks`（ブール値）：サブタスクでフィルタリング
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
     - `custom_fields`（オブジェクト）：カスタムフィールドフィルタを含むオブジェクト
   - 戻り値：一致するタスクのリスト

4. `wrike_get_task`
   - 特定のタスクに関する詳細情報を取得
   - 必須入力：
     - `task_id`（文字列）：取得するタスクID
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：タスクの詳細情報

5. `wrike_create_task`
   - プロジェクトに新しいタスクを作成
   - 必須入力：
     - `folder_id`（文字列）：タスクを作成するフォルダ/プロジェクト
     - `title`（文字列）：タスクのタイトル
   - オプション入力：
     - `description`（文字列）：タスクの説明
     - `status`（文字列）：タスクのステータス
     - `importance`（文字列）：タスクの重要度
     - `dates`（オブジェクト）：タスクの期日
     - `assignees`（文字列の配列）：タスクに割り当てるユーザーIDの配列
     - `followers`（文字列の配列）：フォロワーとして追加するユーザーIDの配列
     - `parent_id`（文字列）：このタスクを配置する親タスクID
   - 戻り値：作成されたタスクの情報

6. `wrike_get_comments`
   - 様々なフィルタリングオプションでWrikeからコメントを取得
   - オプション入力（少なくとも1つは必須）：
     - `task_id`（文字列）：特定のタスクIDのコメントを取得
     - `folder_id`（文字列）：特定のフォルダIDのコメントを取得
     - `comment_ids`（文字列の配列）：特定のコメントをIDで取得（最大100件）
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：コメントのリスト

7. `wrike_update_task`
   - 既存のタスクの詳細を更新
   - 必須入力：
     - `task_id`（文字列）：更新するタスクID
   - オプション入力：
     - `title`（文字列）：タスクの新しいタイトル
     - `description`（文字列）：タスクの新しい説明
     - `status`（文字列）：タスクの新しいステータス
     - `importance`（文字列）：タスクの新しい重要度
     - `dates`（オブジェクト）：タスクの新しい期日
     - `completed`（ブール値）：タスクを完了としてマークするかどうか
   - 戻り値：更新されたタスクの情報

8. `wrike_get_project`
   - 特定のフォルダ/プロジェクトに関する詳細情報を取得
   - 必須入力：
     - `project_id`（文字列）：取得するプロジェクトID
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：プロジェクトの詳細情報

9. `wrike_create_comment`
   - タスクにコメントを作成
   - 必須入力：
     - `task_id`（文字列）：コメントを追加するタスクID
     - `text`（文字列）：コメントのテキスト内容
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：作成されたコメントの情報

10. `wrike_get_contacts`
    - Wrikeの連絡先/ユーザーに関する情報を取得
    - オプション入力：
      - `me`（ブール値）：現在のユーザーの情報のみを返す
      - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
    - 戻り値：連絡先のリスト

11. `wrike_get_timelogs`
    - フィルタリングオプション付きでWrikeからタイムログを取得
    - オプション入力：
      - `task_id`（文字列）：タスクIDでタイムログをフィルタリング
      - `contact_id`（文字列）：連絡先/ユーザーIDでタイムログをフィルタリング
      - `folder_id`（文字列）：フォルダIDでタイムログをフィルタリング
      - `category_id`（文字列）：タイムログカテゴリIDでタイムログをフィルタリング
      - `timelog_ids`（文字列）：取得するタイムログIDのカンマ区切りリスト（最大100件）
      - `start_date`（文字列）：開始日でタイムログをフィルタリング（YYYY-MM-DD形式）
      - `end_date`（文字列）：終了日でタイムログをフィルタリング（YYYY-MM-DD形式）
      - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
    - 戻り値：タイムログのリスト

12. `echo`
    - テスト用の単純なエコー機能
    - 必須入力：
      - `message`（文字列）：エコーバックするメッセージ
    - 戻り値：同じメッセージ

### セットアップ

#### 1. Wrikeアカウントを作成
   - [Wrike](https://www.wrike.com/)にアクセス
   - 「サインアップ」をクリック

#### 2. Wrike APIアプリケーションと認証を設定

##### 永続トークンを使用
   - Wrikeアカウントにログイン
   - [Wrikeアプリディレクトリ](https://www.wrike.com/frontend/apps/index.html#/api)に移動
   - まだない場合は新しいAPIアプリケーションを作成
   - 「永続トークンを取得」をクリックして指示に従う
   - 詳細はこちら：[Wrike OAuth 2.0認証](https://developers.wrike.com/oauth-20-authorization/)

#### 3. MCPサーバーをインストール

   ```bash
   # リポジトリをクローン
   git clone https://github.com/katoiek/mcp-server-wrike.git
   cd mcp-server-wrike

   # 依存関係をインストール
   npm install

   # プロジェクトをビルド
   npm run build
   ```

#### 4. サーバーを構成
   - プロジェクトのルートにある`.env.example`ファイルを`.env`にコピー：
     ```bash
     cp .env.example .env
     ```
   - `.env`ファイルを編集し、`WRIKE_ACCESS_TOKEN`を永続トークンで更新

#### 5. Claude Desktopを構成
   `claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "wrike-mcp-server": {
      "command": "node",
      "args": ["C:/インストールパス/mcp-server-wrike/dist/server.js"],
      "env": {
        "WRIKE_ACCESS_TOKEN": "your-wrike-access-token",
        "WRIKE_HOST": "www.wrike.com",
        "NODE_ENV": "production",
        "LOG_LEVEL": "warn"
      }
    }
  }
}
```

> **注意**: `C:/path/to/mcp-server-wrike/dist/server.js` は、システム上の server.js ファイルの実際のパスに置き換えてください。パスにはフォワードスラッシュ (/) またはエスケープされたバックスラッシュ (\\\\) を使用してください。
```

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/katoiek/mcp-server-wrike.git
cd mcp-server-wrike

# 依存関係をインストール
npm install

# プロジェクトをビルド
npm run build
```

### トラブルシューティング

権限エラーが発生した場合：
1. WrikeプランがAPIアクセスを許可していることを確認
2. アクセストークンが`claude_desktop_config.json`で正しく設定されていることを確認
3. `.env.example`を`.env`にコピーし、永続トークンを更新したことを確認
4. Windowsの場合は`%APPDATA%\Claude\logs`のログを確認

ツールがClaude Desktopに表示されない場合：
1. Claude Desktopを再起動
2. サーバーが`npm run build`で適切にビルドされていることを確認
3. 設定内のserver.jsファイルへのパスが正しいことを確認
4. `.env`ファイルとClaude Desktop設定の両方に同じアクセストークンが設定されていることを確認

パフォーマンスの問題が発生した場合：
1. 設定で`LOG_LEVEL`を`warn`または`error`に設定してログ出力を減らす
2. システムに十分なメモリが利用可能かどうかを確認
3. メモリをクリアするためにClaude Desktopを定期的に再起動
4. パフォーマンス最適化を含む最新バージョンに更新

### 開発

このプロジェクトはTypeScriptで書かれています。このリポジトリをクローンして開発を始めましょう：

```bash
git clone https://github.com/katoiek/mcp-server-wrike.git
cd mcp-server-wrike
npm install
```

#### 最近の改善点

変更をテストしたい場合は、MCP Inspectorを使用できます：

```bash
npm run inspector
```

これにより、クライアントはポート`5173`、サーバーはポート`3000`で公開されます。

これらのポートが他のプロセスで使用されている場合は、以下のように指定できます：

```bash
CLIENT_PORT=5009 SERVER_PORT=3009 npm run inspector
```

または、インスペクターを直接実行することもできます：

```bash
npx @modelcontextprotocol/inspector
```

### ライセンス

このMCPサーバーはMITライセンスの下でライセンスされています。これは、MITライセンスの条件に従って、ソフトウェアを自由に使用、変更、配布できることを意味します。詳細については、プロジェクトリポジトリのLICENSEファイルを参照してください。
