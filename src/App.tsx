import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Home from "./page/Home";
import DefaultLauyout from "./layout/index";
import Register from "./page/Register";
import Login from "./page/Login";
import About from "./page/About";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./page/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <DefaultLauyout>
          <Home />
        </DefaultLauyout>
      ),
    },
    {
      path: "/register",
      element: (
        <DefaultLauyout>
          <Register />
        </DefaultLauyout>
      ),
    },

    {
      path: "/login",
      element: (
        <DefaultLauyout>
          <Login />
        </DefaultLauyout>
      ),
    },
    {
      path: "/about",
      element: (
        <DefaultLauyout>
          <About />
        </DefaultLauyout>
      ),
      },
      {
        path: "/dashboard",
          element: (
        <ProtectedRoute>              
            <DefaultLauyout>
                <Dashboard />
            </DefaultLauyout>
        </ProtectedRoute>
        ),
    },
  ]);

  return (
      <>
          <AuthProvider>  
            <RouterProvider router={router} />
          </AuthProvider>
    </>
  );
}

export default App;
