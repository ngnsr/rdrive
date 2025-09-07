# Todo List

## Client (FileClient / Electron)

- [ ] Implement **local folder monitoring** (fsevents on macOS, inotify on Linux, FSWatcher on Windows, let's go with macOs only)
- [ ] Detect **local file changes** (create, modify, delete)
- [ ] Implement **polling** for remote changes via SyncService
- [ ] Handle **metadata responses** from SyncService:
  - [ ] Download new/updated files from S3 using presigned URL from FileService
  - [ ] Delete local files if removed remotely
- [ ] Request **upload URLs** from FileService for local changes
- [ ] Upload changed files to **S3** using presigned URL
- [ ] Maintain **local metadata** for sync timestamps
- [ ] Implement **file filtering & sorting** (by extension, modification time)
- [ ] UI: show **sync status**, last updated, errors

## Backend

### FileService

- [ ] Implement endpoint to **generate presigned upload URL**
- [ ] Implement endpoint to **generate presigned download URL**
- [ ] Update file metadata in **DynamoDB** after upload
- [ ] Validate user using **AWS Cognito/IAM**
- [ ] (Optional) logging for uploads/downloads

### SyncService

- [ ] Endpoint to **return changed files** since a given timestamp (metadata only)
- [ ] Track **new changes** in DynamoDB
- [ ] Validate user using **AWS Cognito/IAM**
- [ ] Optional: rate-limiting for polling

### Infrastructure / AWS

- [ ] **AWS S3** for file storage
- [ ] **DynamoDB** for metadata (file name, hash, last modified, owner)
- [ ] **Cognito / IAM** for authentication
- [ ] **Load Balancer (ALB/NLB)** in front of FileService + SyncService
- [ ] Optional: CloudWatch for logging/monitoring
