<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

# Todo List

## Client (FileClient / Electron)

- [x] Implement **local folder monitoring** (fsevents on macOS, inotify on Linux, FSWatcher on Windows, let's go with macOs only)
- [x] Detect **local file changes** (create, modify, delete)
- [ ] Implement **polling** for remote changes via SyncService
- [x] Handle **metadata responses** from SyncService:
  - [ ] Download new/updated files from S3 using presigned URL from FileService
  - [ ] Delete local files if removed remotely
- [x] Request **upload URLs** from FileService for local changes
- [x] Upload changed files to **S3** using presigned URL
- [x] Maintain **local metadata** for sync timestamps
- [x] Implement **file filtering & sorting** (by extension, modification time)
- [ ] UI: show **sync status**, last updated, errors

## Backend

### FileService

- [x] Implement endpoint to **generate presigned upload URL**
- [x] Implement endpoint to **generate presigned download URL**
- [x] Update file metadata in **DynamoDB** after upload
- [x] Validate user using **AWS Cognito/IAM**
- [ ] (Optional) logging for uploads/downloads

### SyncService

- [x] Endpoint to **return changed files** since a given timestamp (metadata only)
- [x] Track **new changes** in DynamoDB
- [x] Validate user using **AWS Cognito/IAM**
- [ ] Optional: rate-limiting for polling

### Infrastructure / AWS

- [x] **AWS S3** for file storage
- [x] **DynamoDB** for metadata (file name, hash, last modified, owner)
- [x] **Cognito / IAM** for authentication
- [ ] Optional: CloudWatch for logging/monitoring
