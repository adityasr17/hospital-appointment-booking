import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let role = null;

  if (token) {
    try {
        const decoded = jwtDecode(token);
        role = decoded.role;
    } catch (error) {
        localStorage.removeItem("token");
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50 top-0 left-0 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (role === "patient") navigate("/booking");
            else if (role === "doctor") navigate("/doctor");
            else if (role === "admin") navigate("/admin");
            else navigate("/");
          }}>
             <span className="text-2xl">🏥</span>
             <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
               Hospital<span className="font-light text-gray-500">Booking</span>
             </h1>
          </div>

          <div className="flex gap-4 items-center">
            {role === "patient" && (
              <button 
                onClick={() => navigate("/booking")}
                className="text-gray-600 hover:text-blue-600 font-medium transition"
              >
                Book Appointment
              </button>
            )}

            {role === "doctor" && (
              <button 
                 onClick={() => navigate("/doctor")}
                 className="text-gray-600 hover:text-blue-600 font-medium transition"
              >
                Dashboard
              </button>
            )}

            {role === "admin" && (
              <button 
                 onClick={() => navigate("/admin")}
                 className="text-gray-600 hover:text-blue-600 font-medium transition"
              >
                Admin Panel
              </button>
            )}

            {token ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 shadow-md transition transform hover:scale-105 font-medium text-sm"
              >
                Logout
              </button>
            ) : (
               <div className="flex gap-2">
                 <button onClick={() => navigate("/")} className="text-gray-600 hover:text-blue-600 font-medium">Login</button>
                 <button onClick={() => navigate("/register")} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition font-medium text-sm">Sign Up</button>
               </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
