# Jobsprint Puter Storage Node Documentation

## Overview

The Jobsprint Puter Storage node provides cloud storage operations through Puter.js integration, supporting file and folder management in the cloud.

## Features

- **File Operations**: Upload, download, delete, and get metadata
- **Folder Operations**: Create, list, and delete folders
- **Multiple Encodings**: Support for UTF-8 text and Base64 binary data
- **Recursive Listing**: List folder contents recursively
- **Error Handling**: Robust error handling with continue-on-fail support

## Resources

### 1. File

#### Operations

**Upload File**

Upload files to Puter cloud storage.

**Parameters:**
- `filePath`: Path where file will be stored (e.g., `/documents/report.txt`)
- `fileContent`: Content to upload (text or base64)
- `encoding`: `utf8` (default) or `base64`

**Example - Text Upload:**

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "/notes/meeting-notes.txt",
  "fileContent": "Meeting Date: 2024-01-06\nAttendees: Team A\n\nAgenda:\n1. Review Q1 goals\n2. Plan next sprint",
  "encoding": "utf8"
}
```

**Example - Binary Upload:**

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "/images/profile.png",
  "fileContent": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
  "encoding": "base64"
}
```

**Response:**

```json
{
  "resource": "file",
  "operation": "upload",
  "path": "/notes/meeting-notes.txt",
  "result": {
    "success": true,
    "fileId": "file-abc123",
    "size": 1024,
    "contentType": "text/plain",
    "createdAt": "2024-01-06T00:00:00.000Z"
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

**Download File**

Download files from Puter cloud storage.

**Parameters:**
- `filePath`: Path to file (e.g., `/documents/report.txt`)

**Example:**

```json
{
  "resource": "file",
  "operation": "download",
  "filePath": "/notes/meeting-notes.txt"
}
```

**Response:**

```json
{
  "resource": "file",
  "operation": "download",
  "path": "/notes/meeting-notes.txt",
  "result": {
    "content": "Meeting Date: 2024-01-06...",
    "encoding": "utf8",
    "size": 1024,
    "contentType": "text/plain",
    "metadata": {
      "createdAt": "2024-01-06T00:00:00.000Z",
      "modifiedAt": "2024-01-06T01:00:00.000Z"
    }
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

**Delete File**

Delete files from cloud storage.

**Parameters:**
- `filePath`: Path to file to delete

**Example:**

```json
{
  "resource": "file",
  "operation": "delete",
  "filePath": "/old-notes.txt"
}
```

**Response:**

```json
{
  "resource": "file",
  "operation": "delete",
  "path": "/old-notes.txt",
  "result": {
    "success": true,
    "message": "File deleted successfully"
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

**Get Metadata**

Retrieve file metadata without downloading content.

**Parameters:**
- `filePath`: Path to file

**Example:**

```json
{
  "resource": "file",
  "operation": "metadata",
  "filePath": "/documents/report.pdf"
}
```

**Response:**

```json
{
  "resource": "file",
  "operation": "metadata",
  "path": "/documents/report.pdf",
  "result": {
    "name": "report.pdf",
    "size": 524288,
    "contentType": "application/pdf",
    "createdAt": "2024-01-06T00:00:00.000Z",
    "modifiedAt": "2024-01-06T12:00:00.000Z",
    "checksum": "abc123def456"
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

### 2. Folder

#### Operations

**Create Folder**

Create new folders in cloud storage.

**Parameters:**
- `folderPath`: Path for new folder (e.g., `/projects/2024`)

**Example:**

```json
{
  "resource": "folder",
  "operation": "create",
  "folderPath": "/projects/2024/q1-reports"
}
```

**Response:**

```json
{
  "resource": "folder",
  "operation": "create",
  "path": "/projects/2024/q1-reports",
  "result": {
    "success": true,
    "folderId": "folder-xyz789",
    "createdAt": "2024-01-06T00:00:00.000Z"
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

**List Folder**

List contents of a folder.

**Parameters:**
- `folderPath`: Path to folder
- `recursive`: Include subdirectories (default: false)

**Example - Non-Recursive:**

```json
{
  "resource": "folder",
  "operation": "list",
  "folderPath": "/documents",
  "recursive": false
}
```

**Response:**

```json
{
  "resource": "folder",
  "operation": "list",
  "path": "/documents",
  "result": {
    "files": [
      {
        "name": "report.txt",
        "size": 1024,
        "contentType": "text/plain",
        "modifiedAt": "2024-01-06T00:00:00.000Z"
      },
      {
        "name": "data.json",
        "size": 2048,
        "contentType": "application/json",
        "modifiedAt": "2024-01-06T01:00:00.000Z"
      }
    ],
    "folders": [
      {
        "name": "archive",
        "itemCount": 15
      },
      {
        "name": "templates",
        "itemCount": 8
      }
    ],
    "totalCount": 25
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

**Example - Recursive:**

```json
{
  "resource": "folder",
  "operation": "list",
  "folderPath": "/projects",
  "recursive": true
}
```

**Delete Folder**

Delete folders and all contents.

**Parameters:**
- `folderPath`: Path to folder to delete

**Example:**

```json
{
  "resource": "folder",
  "operation": "delete",
  "folderPath": "/old-projects"
}
```

**Response:**

```json
{
  "resource": "folder",
  "operation": "delete",
  "path": "/old-projects",
  "result": {
    "success": true,
    "deletedCount": 42,
    "message": "Folder and 42 items deleted"
  },
  "timestamp": "2024-01-06T00:00:00.000Z"
}
```

## Workflow Examples

### Example 1: File Backup System

```
Workflow Trigger (Schedule) → Puter Storage (List) → AI (Analyze) → Puter Storage (Backup)
```

**Step 1: List Files**

```json
{
  "resource": "folder",
  "operation": "list",
  "folderPath": "/active-projects",
  "recursive": true
}
```

**Step 2: Filter & Process**

Filter files modified in last 24 hours, then analyze with AI.

**Step 3: Backup**

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "=backups/{{ $now.toISODate() }}/{{ $json.name }}",
  "fileContent": "={{ $json.content }}",
  "encoding": "utf8"
}
```

### Example 2: Document Processing Pipeline

```
Webhook → Puter Storage (Upload) → AI (Extract) → Puter Storage (Save Results)
```

**Upload Original:**

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "=uploads/{{ $json.documentType }}/{{ $json.filename }}",
  "fileContent": "={{ $json.content }}",
  "encoding": "utf8"
}
```

**Process with AI:**

```json
{
  "operation": "text",
  "model": "text-davinci-003",
  "prompt": "=Extract key information from this document:\n\n{{ $json.result.content }}"
}
```

**Save Extracted Data:**

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "=processed/{{ $json.documentType }}-extracted.json",
  "fileContent": "={{ JSON.stringify($json.response) }}",
  "encoding": "utf8"
}
```

### Example 3: Log Rotation

```
Schedule (Daily) → Puter Storage (List Logs) → Compress → Puter Storage (Archive) → Puter Storage (Delete Old)
```

**List Logs:**

```json
{
  "resource": "folder",
  "operation": "list",
  "folderPath": "/logs",
  "recursive": false
}
```

**Archive Old Logs:**

```json
{
  "resource": "file",
  "operation": "upload",
  "filePath": "=logs/archive/{{ $json.name }}.gz",
  "fileContent": "={{ $json.compressedContent }}",
  "encoding": "base64"
}
```

**Delete Original:**

```json
{
  "resource": "file",
  "operation": "delete",
  "filePath": "=logs/{{ $json.name }}"
}
```

## Best Practices

### Path Management

**Use Absolute Paths:**
```
Good: /documents/reports/q1/report.pdf
Bad: reports/q1/report.pdf
```

**Dynamic Paths with Expressions:**
```json
{
  "filePath": "={{ ['projects', $json.projectId, 'reports', $now.toISODate()].join('/') }}.json"
}
```

### File Organization

```
/structure
  /uploads           # Incoming files
  /processed         # Processed results
  /archive           # Old files
  /templates         # Template files
  /config            # Configuration files
```

### Encoding Selection

**Use UTF-8 for:**
- Text files (.txt, .md, .csv, .json)
- Code files (.js, .py, .ts)
- Configuration files

**Use Base64 for:**
- Images (.png, .jpg, .gif)
- PDFs (.pdf)
- Binary files
- Compressed files (.zip, .gz)

### Error Handling

**Handle File Not Found:**

```json
{
  "continueOnFail": true,
  "retryOnFail": true,
  "maxTries": 3
}
```

**Check Response Success:**

```javascript
// In Function node after storage operation
if ($json.result?.success !== true) {
  return [{ json: { error: 'Storage operation failed', data: $json } }];
}
```

### Large Files

**Chunk Large Uploads:**

```
Split File → Upload Chunks → Merge on Server
```

**Use Compression:**

```
Large File → Compress (gzip) → Upload Base64
```

## Limitations

- **File Size**: 10MB per file (soft limit)
- **Path Length**: 1024 characters
- **Concurrent Uploads**: 10 per user
- **Storage Quota**: Depends on account tier

## Troubleshooting

### "File path is required"

Ensure `filePath` or `folderPath` is provided and not empty.

### "File not found"

- Verify path is correct
- Check file exists using Get Metadata first
- Ensure proper path format (starts with `/`)

### Upload Fails

- Check file size is under limit
- Verify encoding matches content type
- Ensure sufficient storage quota
- Check network connectivity

### Folder Delete Fails

- Folder must be empty (or use recursive delete)
- Check permissions
- Verify folder exists

## API Reference

### Endpoints

- `POST /storage/files` - Upload file
- `GET /storage/files` - Download file
- `DELETE /storage/files` - Delete file
- `GET /storage/files/metadata` - Get metadata
- `POST /storage/folders` - Create folder
- `GET /storage/folders` - List folder
- `DELETE /storage/folders` - Delete folder

### Authentication

All requests include Jobsprint API credentials:

```
Authorization: Bearer <your-api-key>
```

### Response Format

```typescript
interface StorageResponse {
  resource: 'file' | 'folder';
  operation: string;
  path: string;
  result: {
    success?: boolean;
    [key: string]: any;
  };
  timestamp: string;
}
```

## See Also

- [Jobsprint AI Node](./AI-NODE.md)
- [Jobsprint Zapier Node](./ZAPIER-NODE.md)
- [Puter.js Documentation](https://puter.js.org/docs)
