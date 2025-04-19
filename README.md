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

Examples:
> Please list all spaces in Wrike.

> Can you tell me the details of a task named "Website Redesign" in Wrike?

> Please summarize all time logs entered by john.doe@example.com in Wrike during 2024.

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

3. `wrike_get_folder_project`
   - Unified tool for working with Wrike folders, projects, and spaces
   - Optional input (at least one is recommended):
     - `space_id` (string): The space to search in
     - `folder_id` (string): The parent folder to search in
     - `folder_ids` (array of strings): Specific folder IDs to retrieve (up to 100)
   - Optional input:
     - `name_pattern` (string): Regular expression pattern to match folder/project names
     - `project_only` (boolean): Only return folders that are projects (default: false)
     - `archived` (boolean): Include archived folders/projects (default: false)
     - `include_history` (boolean): Include folder history when using folder_ids (default: false)
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of matching folders/projects or a single folder/project/space

4. `wrike_get_task`
   - Unified tool for working with Wrike tasks
   - Optional input:
     - `task_id` (string): ID of a specific task to retrieve
     - `folder_id` (string): The folder/project to search tasks in
     - If neither `task_id` nor `folder_id` is provided, all tasks will be retrieved
   - Optional input for task search:
     - `title` (string): Filter by task title
     - `status` (string): Filter by task status
     - `importance` (string): Filter by task importance
     - `completed` (boolean): Filter by completion status (default: false)
     - `subtasks` (boolean): Include subtasks (default: false)
     - `custom_fields` (object): Custom fields to filter by
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: Detailed task information or list of matching tasks

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

6. `wrike_update_task`
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

7. `wrike_get_comments`
   - Get comments from Wrike with various filtering options
   - Optional input (at least one is required):
     - `task_id` (string): Get comments for a specific task ID
     - `folder_id` (string): Get comments for a specific folder ID
     - `comment_ids` (array of strings): Get specific comments by IDs (up to 100)
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of comments

8. `wrike_get_task_comments`
   - Get comments for a specific task
   - Required input:
     - `task_id` (string): The task ID to get comments for
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of comments for the specified task

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

12. `wrike_create_timelog`
    - Create a new timelog entry for a task
    - Required input:
      - `task_id` (string): ID of the task to add the timelog to
      - `hours` (number): Number of hours to log (positive number)
      - `tracked_date` (string): Date when the time was spent (YYYY-MM-DD)
    - Optional input:
      - `comment` (string): Comment for the timelog
      - `category_id` (string): ID of the timelog category
    - Returns: Created timelog information

13. `wrike_update_timelog`
    - Update an existing timelog entry
    - Required input:
      - `timelog_id` (string): ID of the timelog to update
    - Optional input:
      - `hours` (number): New number of hours (positive number)
      - `tracked_date` (string): New date when the time was spent (YYYY-MM-DD)
      - `comment` (string): New comment for the timelog
      - `category_id` (string): New ID of the timelog category
    - Returns: Updated timelog information

14. `wrike_delete_timelog`
    - Delete a timelog entry
    - Required input:
      - `timelog_id` (string): ID of the timelog to delete
    - Returns: Success status

15. `wrike_get_timelog_categories`
    - Get all timelog categories from Wrike
    - Optional input:
      - `opt_fields` (string): Comma-separated list of optional fields to include
    - Returns: List of timelog categories

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

   # Configure the Server - IMPORTANT: Do this BEFORE building
   # Copy the .env.sample file to .env in the project root:
   cp .env.sample .env

   # Edit the .env file and update the WRIKE_ACCESS_TOKEN with your permanent token
   # Then build the project
   npm run build
   ```

#### 4. Configure the Server
   - Copy the `.env.sample` file to `.env` in the project root:
     ```bash
     cp .env.sample .env
     ```
   - Edit the `.env` file and update the `WRIKE_ACCESS_TOKEN` with your permanent token

#### 5. Configure Claude Desktop
   Add the following to your `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "Wrike": {
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

# Configure the Server - IMPORTANT: Do this BEFORE building
# Copy the .env.sample file to .env in the project root:
cp .env.sample .env

# Edit the .env file and update the WRIKE_ACCESS_TOKEN with your permanent token
# Then build the project
npm run build
```

### Troubleshooting

If you encounter permission errors:
1. Ensure your Wrike plan allows API access
2. Confirm the access token is correctly set in `claude_desktop_config.json`
3. Verify that you've copied `.env.sample` to `.env` and updated it with your permanent token
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

# Configure the Server - IMPORTANT: Do this BEFORE building
# Copy the .env.sample file to .env in the project root:
cp .env.sample .env

# Edit the .env file and update the WRIKE_ACCESS_TOKEN with your permanent token
```

#### Recent Improvements

##### v1.1.0 (2025-04-07)
- Fixed timelog functionality
  - Implemented proper API endpoints for creating, updating, and deleting timelogs
  - Added missing type definitions and schemas
  - Fixed issues with timelog data formatting
  - Improved error handling and logging for timelog operations

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
> Wrikeでスペースの一覧をリストで作ってください。

> Wrikeでタスク名「ウェブサイトリニューアル」の詳細を教えて下さい。

> Wrikeでjohn.doe@example.comが2024年に入力したタイムログを集計してください。

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

3. `wrike_get_folder_project`
   - Wrikeのフォルダ、プロジェクト、スペースを操作するための統合ツール
   - オプション入力（少なくとも1つは推奨）：
     - `space_id`（文字列）：検索対象のスペース
     - `folder_id`（文字列）：検索対象の親フォルダ
     - `folder_ids`（文字列の配列）：取得する特定のフォルダID（最大100件）
   - オプション入力：
     - `name_pattern`（文字列）：フォルダ/プロジェクト名に一致する正規表現パターン
     - `project_only`（ブール値）：プロジェクトであるフォルダのみを返す（デフォルト：false）
     - `archived`（ブール値）：アーカイブされたフォルダ/プロジェクトを含める（デフォルト：false）
     - `include_history`（ブール値）：folder_ids使用時にフォルダ履歴を含める（デフォルト：false）
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：一致するフォルダ/プロジェクトのリスト、または特定のフォルダ/プロジェクト/スペースの詳細

4. `wrike_get_task`
   - Wrikeタスクを操作するための統合ツール
   - オプション入力：
     - `task_id`（文字列）：取得する特定のタスクのID
     - `folder_id`（文字列）：タスクを検索するフォルダ/プロジェクト
     - `task_id`も`folder_id`も指定されていない場合、すべてのタスクが取得されます
   - タスク検索用のオプション入力：
     - `title`（文字列）：タスクタイトルでフィルタリング
     - `status`（文字列）：タスクステータスでフィルタリング
     - `importance`（文字列）：タスクの重要度でフィルタリング
     - `completed`（ブール値）：完了状態でフィルタリング（デフォルト：false）
     - `subtasks`（ブール値）：サブタスクを含める（デフォルト：false）
     - `custom_fields`（オブジェクト）：フィルタリングするカスタムフィールド
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：タスクの詳細情報または一致するタスクのリスト

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

6. `wrike_update_task`
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

7. `wrike_get_comments`
   - 様々なフィルタリングオプションでWrikeからコメントを取得
   - オプション入力（少なくとも1つは必須）：
     - `task_id`（文字列）：特定のタスクIDのコメントを取得
     - `folder_id`（文字列）：特定のフォルダIDのコメントを取得
     - `comment_ids`（文字列の配列）：特定のコメントをIDで取得（最大100件）
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：コメントのリスト

8. `wrike_get_task_comments`
   - 特定のタスクのコメントを取得
   - 必須入力：
     - `task_id`（文字列）：コメントを取得するタスクID
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：指定されたタスクのコメントリスト

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

12. `wrike_create_timelog`
    - タスクに新しいタイムログエントリを作成
    - 必須入力：
      - `task_id`（文字列）：タイムログを追加するタスクのID
      - `hours`（数値）：記録する時間数（正の数）
      - `tracked_date`（文字列）：時間が費やされた日付（YYYY-MM-DD形式）
    - オプション入力：
      - `comment`（文字列）：タイムログのコメント
      - `category_id`（文字列）：タイムログカテゴリのID
    - 戻り値：作成されたタイムログ情報

13. `wrike_update_timelog`
    - 既存のタイムログエントリを更新
    - 必須入力：
      - `timelog_id`（文字列）：更新するタイムログのID
    - オプション入力：
      - `hours`（数値）：新しい時間数（正の数）
      - `tracked_date`（文字列）：時間が費やされた新しい日付（YYYY-MM-DD形式）
      - `comment`（文字列）：タイムログの新しいコメント
      - `category_id`（文字列）：タイムログカテゴリの新しいID
    - 戻り値：更新されたタイムログ情報

14. `wrike_delete_timelog`
    - タイムログエントリを削除
    - 必須入力：
      - `timelog_id`（文字列）：削除するタイムログのID
    - 戻り値：成功ステータス

15. `wrike_get_timelog_categories`
    - Wrikeからすべてのタイムログカテゴリを取得
    - オプション入力：
      - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
    - 戻り値：タイムログカテゴリのリスト

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

   # サーバーを構成 - 重要: ビルド前にこれを行ってください
   # プロジェクトのルートにある.env.sampleファイルを.envにコピー：
   cp .env.sample .env

   # .envファイルを編集し、WRIKE_ACCESS_TOKENを永続トークンで更新
   # その後、プロジェクトをビルド
   npm run build
   ```

#### 4. サーバーを構成
   - プロジェクトのルートにある`.env.sample`ファイルを`.env`にコピー：
     ```bash
     cp .env.sample .env
     ```
   - `.env`ファイルを編集し、`WRIKE_ACCESS_TOKEN`を永続トークンで更新

#### 5. Claude Desktopを構成
   `claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "Wrike": {
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

# サーバーを構成 - 重要: ビルド前にこれを行ってください
# プロジェクトのルートにある.env.sampleファイルを.envにコピー：
cp .env.sample .env

# .envファイルを編集し、WRIKE_ACCESS_TOKENを永続トークンで更新
# その後、プロジェクトをビルド
npm run build
```

### トラブルシューティング

権限エラーが発生した場合：
1. WrikeプランがAPIアクセスを許可していることを確認
2. アクセストークンが`claude_desktop_config.json`で正しく設定されていることを確認
3. `.env.sample`を`.env`にコピーし、永続トークンを更新したことを確認
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

# サーバーを構成 - 重要: ビルド前にこれを行ってください
# プロジェクトのルートにある.env.sampleファイルを.envにコピー：
cp .env.sample .env

# .envファイルを編集し、WRIKE_ACCESS_TOKENを永続トークンで更新
```

#### 最近の改善点

##### v1.1.0 (2025-04-07)
- タイムログ機能の修正
  - タイムログの作成、更新、削除のための適切なAPIエンドポイントを実装
  - 不足していた型定義とスキーマを追加
  - タイムログデータのフォーマットに関する問題を修正
  - タイムログ操作のエラーハンドリングとログ記録を改善

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
