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
// import { Suspense } from 'react';
// import { Canvas } from '@react-three/fiber';
// import { Environment, OrbitControls } from '@react-three/drei';

// import { Model } from './components/Model';

// export default function App() {
//   return (
//     <div className="App">
//       <Canvas
//         style={{ height: '100vh', width: '100vw' }}
//         camera={{ position: [0, 0, 5], fov: 50 }}
//       >
//         <Suspense fallback={null}>
//           <ambientLight intensity={0.5} />
//           <pointLight position={[10, 10, 10]} intensity={1} color="#ff00cc" />
//           <pointLight position={[-10, -10, -10]} intensity={1} color="#39ff14" />

//           <Model />

//           <Environment preset="sunset" background />
//           <OrbitControls enableDamping={true} dampingFactor={0.05} />
//         </Suspense>
//       </Canvas>
//     </div>
//   );
// }

