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
import SubmissionPage from "./page/Submission";
import ProfilePage from "./page/Profile"
import VerificationSuccess from "./page/VerificationSuccess";
import LeaderboardPage from "./page/Leaderboard";
import Admin from "./page/Admin";
import SimulationPage from "./page/Simulation";
import DirectoryPage from "./page/Directory";
import VerifyAccount from "./page/VerifyAccount";
import VerifiedRoute from "./components/VerifiedRoute";
import VerifiedAdminRoute from "./components/VerifiedAdminRoute";
import ContainerManagerPage from "./page/ContainerManager";
import GamePage from "./page/Game";
import JobGamesPage from "./page/JobGames";
import Replay from "./page/Replay";

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
      path: "/verification-success",
      element: (
        <DefaultLauyout>
          <VerificationSuccess />
        </DefaultLauyout>
      ),
    },
    {
      path: "/verify-account",
      element: (
        <ProtectedRoute>
          <DefaultLauyout>
            <VerifyAccount />
          </DefaultLauyout>
        </ProtectedRoute>
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
        <VerifiedRoute>              
            <DefaultLauyout>
                <Dashboard />
            </DefaultLauyout>
        </VerifiedRoute>
        ),
    },
    {
      path: "/submission",
        element: (
      <VerifiedRoute>              
          <DefaultLauyout>
              <SubmissionPage  />
          </DefaultLauyout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/leaderboard",
        element: (
      <VerifiedRoute>              
          <DefaultLauyout>
              <LeaderboardPage  />
          </DefaultLauyout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/games",
        element: (
      <VerifiedRoute>              
          <DefaultLauyout>
              <GamePage  />
          </DefaultLauyout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/games/:jobId",
      element: (
        <VerifiedRoute>
          <DefaultLauyout>
            <JobGamesPage />
          </DefaultLauyout>
        </VerifiedRoute>
      ),
    },
    {
      path: "/directory",
        element: (
      <VerifiedRoute>              
          <DefaultLauyout>
              <DirectoryPage  />
          </DefaultLauyout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/profile",
        element: (
      <VerifiedRoute>              
          <DefaultLauyout>
              <ProfilePage  />
          </DefaultLauyout>
      </VerifiedRoute>
      ),
    },  
    {
      path: "/profile/:username",
      element: (
        <DefaultLauyout>
          <ProfilePage />
        </DefaultLauyout>
      ),
    },
    {
      path: "/admin",
      element: (
        <VerifiedAdminRoute>
          <DefaultLauyout>
            <Admin />
          </DefaultLauyout>
        </VerifiedAdminRoute>
      ),
    },
    {
      path: "/simulation",
      element: (
        <VerifiedAdminRoute>              
            <DefaultLauyout>
                <SimulationPage  />
            </DefaultLauyout>
        </VerifiedAdminRoute>
      ),
    },
    {
      path: "/container-manager",
      element: (
        <VerifiedAdminRoute>              
            <DefaultLauyout>
                <ContainerManagerPage  />
            </DefaultLauyout>
        </VerifiedAdminRoute>
      ),
    },
    {
      path: "/replay/:gameId",
      element: (
        <DefaultLauyout>
          <Replay />
        </DefaultLauyout>
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
