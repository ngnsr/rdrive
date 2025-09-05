const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const uploadDir = path.join(__dirname, "uploads");
const syncDir = path.join(__dirname, "sync");
const metadataFile = path.join(__dirname, "files.json");

// Ensure directories exist
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(syncDir)) fs.mkdirSync(syncDir);

// Initialize metadata file if it doesn't exist
if (!fs.existsSync(metadataFile)) {
  fs.writeFileSync(metadataFile, JSON.stringify([]));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

app.use(express.json());

// Upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const metadata = {
    name: req.file.originalname,
    filename: req.file.filename,
    uploadedAt: new Date().toISOString(),
    mtime: fs.statSync(req.file.path).mtime,
  };
  const files = JSON.parse(fs.readFileSync(metadataFile));
  files.push(metadata);
  fs.writeFileSync(metadataFile, JSON.stringify(files));
  res.json({
    message: "File uploaded successfully",
    filename: req.file.filename,
  });
});

// Get file list endpoint
app.get("/files", (req, res) => {
  const files = JSON.parse(fs.readFileSync(metadataFile));
  res.json(files);
});

// Delete endpoint
app.delete("/delete/:name", (req, res) => {
  console.log("start deleting");
  const name = req.params.name;
  console.log(name);
  let files = JSON.parse(fs.readFileSync(metadataFile));
  // todo: we deleting first file with same name, it's wrong, if we allow multiple files with the same name, so we shouldn't allow
  const fileIndex = files.findIndex((file) => file.name === name);

  console.log(fileIndex);
  if (fileIndex === -1) {
    console.log("File not found");
    return res.status(404).json({ error: "File not found" });
  }
  console.log(3);

  // Remove file from filesystem
  const filePath = path.join(uploadDir, name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  console.log(4);
  // Remove metadata
  files.splice(fileIndex, 1);
  fs.writeFileSync(metadataFile, JSON.stringify(files));

  console.log(5);
  res.json({ message: "File deleted successfully" });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
