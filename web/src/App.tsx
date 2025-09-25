import { useAuth } from "./auth/useAuth";
import Auth from "./pages/Auth";
import FilesPage from "./pages/FilesPage";

export default function App() {
  const { user, logout } = useAuth();

  return (
    <div>
      {user ? (
        <>
          <header className="flex justify-between p-4 bg-gray-100">
            <span>Welcome {user.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Logout
            </button>
          </header>
          <FilesPage ownerId={user.email} />
        </>
      ) : (
        <Auth />
      )}
    </div>
  );
}
