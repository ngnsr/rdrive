import FileUpload from "../components/FileUpload";
import FileTable from "../components/FileTable";

export default function FilesPage({ ownerId }: { ownerId: string }) {
  return (
    <div className="p-4 max-w-3xl mx-auto grid gap-4">
      <FileUpload ownerId={ownerId} />
      <FileTable ownerId={ownerId} />
    </div>
  );
}
