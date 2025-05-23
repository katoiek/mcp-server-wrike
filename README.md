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
>
> Can you get information about a specific space with ID "ABCDE123" in Wrike?

> Can you tell me the details of a task named "Website Redesign" in Wrike?

> Please summarize all time logs entered by john.doe@example.com in Wrike during 2024.

### Available Functions

#### Read Operations (List & Get)

1. `wrike_get_space`
   - Get spaces information from Wrike
   - Optional input:
     - `space_id` (string): Space ID to get specific space. If not provided, all spaces will be returned
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of spaces or a specific space

2. `wrike_get_folder_project`
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

3. `wrike_get_task`
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

4. `wrike_get_comments`
   - Get comments from Wrike with various filtering options
   - Optional input (at least one is required):
     - `task_id` (string): Get comments for a specific task ID
     - `folder_id` (string): Get comments for a specific folder ID
     - `comment_ids` (array of strings): Get specific comments by IDs (up to 100)
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of comments

5. `wrike_get_task_comments`
   - Get comments for a specific task
   - Required input:
     - `task_id` (string): The task ID to get comments for
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of comments for the specified task

6. `wrike_get_contacts`
   - Get information about Wrike contacts/users
   - Optional input:
     - `contact_ids` (array of strings): Array of contact IDs to retrieve (up to 100)
     - `me` (boolean): Return only the current user's information
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of contacts

7. `wrike_get_timelogs`
   - Get timelogs from Wrike with filtering options
   - Optional input (at least one is recommended):
     - `task_id` (string): Filter timelogs by task ID
     - `contact_id` (string): Filter timelogs by contact/user ID
     - `folder_id` (string): Filter timelogs by folder ID
     - `category_id` (string): Filter timelogs by timelog category ID
     - `timelog_ids` (array of strings): Array of timelog IDs to retrieve (up to 100)
     - `start_date` (string): Filter timelogs by start date (YYYY-MM-DD)
     - `end_date` (string): Filter timelogs by end date (YYYY-MM-DD)
     - `me` (boolean): Whether to retrieve only your own timelogs
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of timelogs

8. `wrike_get_timelog_categories`
   - Get all timelog categories from Wrike
   - Optional input:
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of timelog categories

9. `wrike_get_custom_item_types`
   - Get custom item types from Wrike
   - Optional input:
     - `id` (string): Custom item type ID (if specified, retrieves a specific custom item type)
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of custom item types or a specific custom item type

10. `wrike_get_folder_blueprints`
   - Get folder blueprints from Wrike
   - Optional input:
     - `space_id` (string): Space ID (if specified, retrieves folder blueprints from this space)
   - Returns: List of folder blueprints

11. `wrike_get_task_blueprints`
   - Get task blueprints from Wrike
   - Optional input:
     - `space_id` (string): Space ID (if specified, retrieves task blueprints from this space)
   - Returns: List of task blueprints

12. `wrike_get_customfields`
   - Get custom fields from Wrike
   - Optional input:
     - `customfield_ids` (array of strings): Array of custom field IDs to retrieve (up to 100)
     - `opt_fields` (string): Comma-separated list of optional fields to include
   - Returns: List of custom fields or specific custom fields by IDs

#### Write Operations (Create, Update, Delete)

10. `wrike_create_folder_project`
   - Create a new folder or project in Wrike
   - Required input:
     - `parent_folder_id` (string): ID of the parent folder
     - `title` (string): Title of the folder/project
   - Optional input:
     - `description` (string): Description of the folder/project
     - `is_project` (boolean): Whether to create as a project (default: false)
     - `project_owner_ids_str` (string): Comma-separated list of project owner IDs
     - `project_status` (string): Project status (Green, Yellow, Red, Completed, OnHold, Cancelled)
     - `project_start_date` (string): Project start date (ISO format: YYYY-MM-DD)
     - `project_end_date` (string): Project end date (ISO format: YYYY-MM-DD)
     - `custom_fields` (array): Array of custom fields
   - Returns: Created folder/project information

10. `wrike_create_task`
    - Create a new task in a project
    - Required input:
      - `folder_id` (string): The folder/project to create the task in
      - `title` (string): Title of the task
    - Optional input:
      - `description` (string): Description of the task
      - `status` (string): Status of the task (Active, Completed, Deferred, Cancelled)
      - `importance` (string): Importance of the task (High, Normal, Low)
      - `dates` (object): Due dates for the task with start, due, type, and duration properties
      - `responsibles` (array of strings): Array of user IDs to assign to the task
      - `followers` (array of strings): Array of user IDs to add as followers
      - `parent_id` (string): The parent task ID to set this task under (creates a subtask)
      - `custom_fields` (array): Array of custom fields with id and value properties
    - Returns: Created task information

11. `wrike_update_task`
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

12. `wrike_create_comment`
    - Create a comment on a task
    - Required input:
      - `task_id` (string): The task ID to add the comment to
      - `text` (string): The text content of the comment
    - Optional input:
      - `plain_text` (boolean): Whether to treat the comment as plain text
    - Returns: Created comment information

13. `wrike_create_timelog`
    - Create a new timelog entry for a task
    - Required input:
      - `task_id` (string): ID of the task to add the timelog to
      - `hours` (number): Number of hours to log (positive number)
      - `trackedDate` (string): Date for which timelog was recorded. Format: yyyy-MM-dd
    - Optional input:
      - `comment` (string): Comment for the timelog
      - `category_id` (string): ID of the timelog category
    - Returns: Created timelog information

14. `wrike_update_timelog`
    - Update an existing timelog entry
    - Required input:
      - `timelog_id` (string): ID of the timelog to update
    - Optional input:
      - `hours` (number): New number of hours (positive number)
      - `trackedDate` (string): Date for which timelog was recorded. Format: yyyy-MM-dd
      - `comment` (string): New comment for the timelog
      - `category_id` (string): New ID of the timelog category
    - Returns: Updated timelog information

15. `wrike_delete_timelog`
    - Delete a timelog entry
    - Required input:
      - `timelog_id` (string): ID of the timelog to delete
    - Returns: Success status

16. `wrike_create_work_from_custom_item_types`
    - Create a task from a custom item type
    - Required input:
      - `custom_item_type_id` (string): ID of the custom item type to create work from
      - `parent_id` (string): ID of parent folder or project (Either this parameter or super_task_id is required)
      - `super_task_id` (string): ID of parent task to add work as a subtask (Either this parameter or parent_id is required)
      - `title` (string): Title of the task to create
    - Optional input:
      - `description` (string): Description of the task
      - `status` (string): Status of the task
      - `importance` (string): Importance of the task (High, Normal, Low)
      - `dates` (object): Task dates with properties like start, due, type, duration
      - `assignees` (array of strings): Array of user IDs to assign to the task
      - `followers` (array of strings): Array of user IDs to add as followers
      - `custom_fields` (array): Array of custom fields with id and value properties
    - Returns: Created task information

17. `wrike_create_work_from_folder_blueprint`
    - Create work from a folder blueprint in Wrike
    - Required input:
      - `folder_blueprint_id` (string): ID of the folder blueprint to launch
      - `parent_id` (string): ID of the parent folder where the blueprint will be created
      - `title` (string): Title for the created work
    - Optional input:
      - `title_prefix` (string): Title prefix for all copied tasks
      - `description` (string): Description for the created work
      - `copy_descriptions` (boolean): Copy descriptions or leave empty (default: true)
      - `notify_responsibles` (boolean): Notify those responsible (default: true)
      - `copy_responsibles` (boolean): Copy those responsible (default: true)
      - `copy_custom_fields` (boolean): Copy custom fields (default: true)
      - `copy_attachments` (boolean): Copy attachments (default: false)
      - `reschedule_date` (string): Date to use in task rescheduling (format: YYYY-MM-DD)
      - `reschedule_mode` (enum): Mode for rescheduling: Start/start or End/end
      - `entry_limit` (number): Maximum number of tasks/folders in tree for copy (1-250, default: 250)
    - Returns: Async job ID for the launched blueprint

18. `wrike_create_work_from_task_blueprint`
    - Create work from a task blueprint in Wrike
    - Required input:
      - `task_blueprint_id` (string): ID of the task blueprint to launch
      - `title` (string): Title for the created task
      - `parent_id` (string): ID of parent folder or project (Either this parameter or super_task_id is required)
      - `super_task_id` (string): ID of parent task to add work as a subtask (Either this parameter or parent_id is required)
    - Optional input:
      - `title_prefix` (string): Title prefix for all copied tasks
      - `copy_descriptions` (boolean): Copy descriptions or leave empty (default: true)
      - `notify_responsibles` (boolean): Notify those responsible (default: true)
      - `copy_responsibles` (boolean): Copy those responsible (default: true)
      - `copy_custom_fields` (boolean): Copy custom fields (default: true)
      - `copy_attachments` (boolean): Copy attachments (default: false)
      - `reschedule_date` (string): Date to use in task rescheduling (format: YYYY-MM-DD)
      - `reschedule_mode` (enum): Mode for rescheduling: Start/start or End/end
      - `entry_limit` (number): Maximum number of tasks/folders in tree for copy (1-250, default: 250)
    - Returns: Async job ID for the launched blueprint

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

#### 4. Configure Claude Desktop
   Add the following to your `claude_desktop_config.json`:

##### Option 1: Using npx (recommended for global installation)
```json
{
  "mcpServers": {
    "wrike": {
      "command": "node",
      "args": ["your-mcp-server-path/server.js"],
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

##### Option 2: Using node (for local installation)
```json
{
  "mcpServers": {
    "wrike-mcp-server": {
      "command": "node",
      "args": ["/path/to/mcp-server-wrike/dist/server.js"],
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

> **Note**: This server is designed to be run directly from Claude Desktop, which passes environment variables directly. No `.env` file is needed or used.

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
3. Check the logs in `%APPDATA%\Claude\logs` on Windows

If tools are not showing up in Claude Desktop:
1. Restart Claude Desktop
2. Ensure the server is properly built with `npm run build`
3. Check that the path to the server.js file is correct in your configuration


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
>
> WrikeでID「ABCDE123」の特定のスペース情報を取得してください。

> Wrikeでタスク名「ウェブサイトリニューアル」の詳細を教えて下さい。

> Wrikeでjohn.doe@example.comが2024年に入力したタイムログを集計してください。

### 利用可能な関数

#### 参照系操作（一覧取得・情報取得）

1. `wrike_get_space`
   - Wrikeからスペース情報を取得
   - オプション入力：
     - `space_id`（文字列）：特定のスペースを取得するためのスペースID。指定しない場合は全スペースが返されます
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：スペースのリストまたは特定のスペース情報

2. `wrike_get_folder_project`
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

3. `wrike_get_task`
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

4. `wrike_get_comments`
   - 様々なフィルタリングオプションでWrikeからコメントを取得
   - オプション入力（少なくとも1つは必須）：
     - `task_id`（文字列）：特定のタスクIDのコメントを取得
     - `folder_id`（文字列）：特定のフォルダIDのコメントを取得
     - `comment_ids`（文字列の配列）：特定のコメントをIDで取得（最大100件）
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：コメントのリスト

5. `wrike_get_task_comments`
   - 特定のタスクのコメントを取得
   - 必須入力：
     - `task_id`（文字列）：コメントを取得するタスクID
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：指定されたタスクのコメントリスト

6. `wrike_get_contacts`
   - Wrikeの連絡先/ユーザーに関する情報を取得
   - オプション入力：
     - `contact_ids`（文字列の配列）：取得するコンタクトIDの配列（最大100件）
     - `me`（ブール値）：現在のユーザーの情報のみを返す
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：連絡先のリスト

7. `wrike_get_timelogs`
   - フィルタリングオプション付きでWrikeからタイムログを取得
   - オプション入力（少なくとも1つは推奨）：
     - `task_id`（文字列）：タスクIDでタイムログをフィルタリング
     - `contact_id`（文字列）：連絡先/ユーザーIDでタイムログをフィルタリング
     - `folder_id`（文字列）：フォルダIDでタイムログをフィルタリング
     - `category_id`（文字列）：タイムログカテゴリIDでタイムログをフィルタリング
     - `timelog_ids`（文字列の配列）：取得するタイムログIDの配列（最大100件）
     - `start_date`（文字列）：開始日でタイムログをフィルタリング（YYYY-MM-DD形式）
     - `end_date`（文字列）：終了日でタイムログをフィルタリング（YYYY-MM-DD形式）
     - `me`（ブール値）：自分のタイムログのみを取得するかどうか
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：タイムログのリスト

8. `wrike_get_timelog_categories`
   - Wrikeからすべてのタイムログカテゴリを取得
   - オプション入力：
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：タイムログカテゴリのリスト

9. `wrike_get_custom_item_types`
   - カスタムアイテムタイプを取得
   - オプション入力：
     - `id`（文字列）：カスタムアイテムタイプID（指定すると、特定のカスタムアイテムタイプを取得）
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：カスタムアイテムタイプのリストまたは特定のカスタムアイテムタイプ

10. `wrike_get_folder_blueprints`
   - フォルダブループリントを取得
   - オプション入力：
     - `space_id`（文字列）：スペースID（指定すると、このスペース内のフォルダブループリントを取得）
   - 戻り値：フォルダブループリントのリスト

11. `wrike_get_task_blueprints`
   - タスクブループリントを取得
   - オプション入力：
     - `space_id`（文字列）：スペースID（指定すると、このスペース内のタスクブループリントを取得）
   - 戻り値：タスクブループリントのリスト

12. `wrike_get_customfields`
   - カスタムフィールドを取得
   - オプション入力：
     - `customfield_ids`（文字列の配列）：取得するカスタムフィールドIDの配列（最大100個）
     - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
   - 戻り値：カスタムフィールドのリスト、または指定したIDのカスタムフィールド

#### 更新系操作（作成・更新・削除）

12. `wrike_create_folder_project`
   - Wrikeに新しいフォルダまたはプロジェクトを作成
   - 必須入力：
     - `parent_folder_id`（文字列）：親フォルダのID
     - `title`（文字列）：フォルダ/プロジェクトのタイトル
   - オプション入力：
     - `description`（文字列）：フォルダ/プロジェクトの説明
     - `is_project`（ブール値）：プロジェクトとして作成するかどうか（デフォルト：false）
     - `project_owner_ids_str`（文字列）：プロジェクトオーナーIDのカンマ区切りリスト
     - `project_status`（文字列）：プロジェクトステータス（Green、Yellow、Red、Completed、OnHold、Cancelled）
     - `project_start_date`（文字列）：プロジェクト開始日（ISO形式：YYYY-MM-DD）
     - `project_end_date`（文字列）：プロジェクト終了日（ISO形式：YYYY-MM-DD）
     - `custom_fields`（配列）：カスタムフィールドの配列
   - 戻り値：作成されたフォルダ/プロジェクトの情報

10. `wrike_create_task`
    - プロジェクトに新しいタスクを作成
    - 必須入力：
      - `folder_id`（文字列）：タスクを作成するフォルダ/プロジェクト
      - `title`（文字列）：タスクのタイトル
    - オプション入力：
      - `description`（文字列）：タスクの説明
      - `status`（文字列）：タスクのステータス（Active、Completed、Deferred、Cancelled）
      - `importance`（文字列）：タスクの重要度（High、Normal、Low）
      - `dates`（オブジェクト）：タスクの期日（start、due、type、durationプロパティを含む）
      - `responsibles`（文字列の配列）：タスクに割り当てるユーザーIDの配列
      - `followers`（文字列の配列）：フォロワーとして追加するユーザーIDの配列
      - `parent_id`（文字列）：このタスクを配置する親タスクID（サブタスクとして作成）
      - `custom_fields`（配列）：idとvalueプロパティを持つカスタムフィールドの配列
    - 戻り値：作成されたタスクの情報

11. `wrike_update_task`
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

12. `wrike_create_comment`
    - タスクにコメントを作成
    - 必須入力：
      - `task_id`（文字列）：コメントを追加するタスクID
      - `text`（文字列）：コメントのテキスト内容
    - オプション入力：
      - `opt_fields`（文字列）：含める追加フィールドのカンマ区切りリスト
    - 戻り値：作成されたコメントの情報

13. `wrike_create_timelog`
    - タスクに新しいタイムログエントリを作成
    - 必須入力：
      - `task_id`（文字列）：タイムログを追加するタスクのID
      - `hours`（数値）：記録する時間数（正の数）
      - `trackedDate`（文字列）：タイムログが記録された日付（yyyy-MM-dd形式）
    - オプション入力：
      - `comment`（文字列）：タイムログのコメント
      - `category_id`（文字列）：タイムログカテゴリのID
    - 戻り値：作成されたタイムログ情報

14. `wrike_update_timelog`
    - 既存のタイムログエントリを更新
    - 必須入力：
      - `timelog_id`（文字列）：更新するタイムログのID
    - オプション入力：
      - `hours`（数値）：新しい時間数（正の数）
      - `trackedDate`（文字列）：タイムログが記録された日付（yyyy-MM-dd形式）
      - `comment`（文字列）：タイムログの新しいコメント
      - `category_id`（文字列）：タイムログカテゴリの新しいID
    - 戻り値：更新されたタイムログ情報

15. `wrike_delete_timelog`
    - タイムログエントリを削除
    - 必須入力：
      - `timelog_id`（文字列）：削除するタイムログのID
    - 戻り値：成功ステータス

16. `wrike_create_work_from_custom_item_types`
    - カスタムアイテムタイプからタスクを作成
    - 必須入力：
      - `custom_item_type_id`（文字列）：作業を作成するカスタムアイテムタイプのID
      - `parent_id`（文字列）：親フォルダまたはプロジェクトのID（このパラメータまたはsuper_task_idのいずれかが必要）
      - `super_task_id`（文字列）：サブタスクとして作業を追加する親タスクのID（このパラメータまたはparent_idのいずれかが必要）
      - `title`（文字列）：作成するタスクのタイトル
    - オプション入力：
      - `description`（文字列）：タスクの説明
      - `status`（文字列）：タスクのステータス
      - `importance`（文字列）：タスクの重要度（High、Normal、Low）
      - `dates`（オブジェクト）：start、due、type、durationなどのプロパティを持つタスク日付
      - `assignees`（文字列の配列）：タスクに割り当てるユーザーIDの配列
      - `followers`（文字列の配列）：フォロワーとして追加するユーザーIDの配列
      - `custom_fields`（配列）：idとvalueプロパティを持つカスタムフィールドの配列
    - 戻り値：作成されたタスク情報

17. `wrike_create_work_from_folder_blueprint`
    - Wrikeでフォルダブループリントから作業を作成
    - 必須入力：
      - `folder_blueprint_id`（文字列）：起動するフォルダブループリントのID
      - `parent_id`（文字列）：ブループリントが作成される親フォルダのID
      - `title`（文字列）：作成される作業のタイトル
    - オプション入力：
      - `title_prefix`（文字列）：コピーされるすべてのタスクのタイトルプレフィックス
      - `description`（文字列）：作成される作業の説明
      - `copy_descriptions`（ブール値）：説明をコピーするか空のままにするか（デフォルト：true）
      - `notify_responsibles`（ブール値）：担当者に通知するか（デフォルト：true）
      - `copy_responsibles`（ブール値）：担当者をコピーするか（デフォルト：true）
      - `copy_custom_fields`（ブール値）：カスタムフィールドをコピーするか（デフォルト：true）
      - `copy_attachments`（ブール値）：添付ファイルをコピーするか（デフォルト：false）
      - `reschedule_date`（文字列）：タスクの再スケジュールに使用する日付（形式：YYYY-MM-DD）
      - `reschedule_mode`（列挙型）：再スケジュールモード：Start/startまたはEnd/end
      - `entry_limit`（数値）：コピーするタスク/フォルダのツリーの最大数（1-250、デフォルト：250）
    - 戻り値：起動されたブループリントの非同期ジョブID

18. `wrike_create_work_from_task_blueprint`
    - Wrikeでタスクブループリントから作業を作成
    - 必須入力：
      - `task_blueprint_id`（文字列）：起動するタスクブループリントのID
      - `title`（文字列）：作成されるタスクのタイトル
      - `parent_id`（文字列）：親フォルダまたはプロジェクトのID（このパラメータまたはsuper_task_idのいずれかが必要）
      - `super_task_id`（文字列）：サブタスクとして作業を追加する親タスクのID（このパラメータまたはparent_idのいずれかが必要）
    - オプション入力：
      - `title_prefix`（文字列）：コピーされるすべてのタスクのタイトルプレフィックス
      - `copy_descriptions`（ブール値）：説明をコピーするか空のままにするか（デフォルト：true）
      - `notify_responsibles`（ブール値）：担当者に通知するか（デフォルト：true）
      - `copy_responsibles`（ブール値）：担当者をコピーするか（デフォルト：true）
      - `copy_custom_fields`（ブール値）：カスタムフィールドをコピーするか（デフォルト：true）
      - `copy_attachments`（ブール値）：添付ファイルをコピーするか（デフォルト：false）
      - `reschedule_date`（文字列）：タスクの再スケジュールに使用する日付（形式：YYYY-MM-DD）
      - `reschedule_mode`（列挙型）：再スケジュールモード：Start/startまたはEnd/end
      - `entry_limit`（数値）：コピーするタスク/フォルダのツリーの最大数（1-250、デフォルト：250）
    - 戻り値：起動されたブループリントの非同期ジョブID

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

#### 4. Claude Desktopを構成
   `claude_desktop_config.json` に以下を追加：

```json
{
  "mcpServers": {
    "wrike": {
      "command": "node",
      "args": ["your-mcp-server-path/server.js"],
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

> **注意**: このサーバーはClaude Desktopから直接実行されるように設計されており、環境変数が直接渡されます。`.env`ファイルは必要なく、使用されません。

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
3. Windowsの場合は`%APPDATA%\Claude\logs`のログを確認

ツールがClaude Desktopに表示されない場合：
1. Claude Desktopを再起動
2. サーバーが`npm run build`で適切にビルドされていることを確認
3. Claude Desktop設定内のアクセストークンが正しいことを確認

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

### ライセンス

このMCPサーバーはMITライセンスの下でライセンスされています。これは、MITライセンスの条件に従って、ソフトウェアを自由に使用、変更、配布できることを意味します。詳細については、プロジェクトリポジトリのLICENSEファイルを参照してください。
