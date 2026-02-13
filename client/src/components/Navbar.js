import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let role = null;

  if (token) {
    const decoded = jwtDecode(token);
    role = decoded.role;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center">
      <h1 className="text-xl font-bold">🏥 Hospital System</h1>

      <div className="flex gap-4 items-center">
        {role === "patient" && (
          <button onClick={() => navigate("/booking")}>
            Booking
          </button>
        )}

        {role === "doctor" && (
          <button onClick={() => navigate("/doctor")}>
            Doctor Dashboard
          </button>
        )}

        {role === "admin" && (
          <button onClick={() => navigate("/admin")}>
            Admin Panel
          </button>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
