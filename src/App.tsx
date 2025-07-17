import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.css";
import Home from "./page/Home";
import DefaultLayout from "./layout/index";
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
        <DefaultLayout>
          <Home />
        </DefaultLayout>
      ),
    },
    {
      path: "/register",
      element: (
        <DefaultLayout>
          <Register />
        </DefaultLayout>
      ),
    },

    {
      path: "/login",
      element: (
        <DefaultLayout>
          <Login />
        </DefaultLayout>
      ),
    },
    {
      path: "/verification-success",
      element: (
        <DefaultLayout>
          <VerificationSuccess />
        </DefaultLayout>
      ),
    },
    {
      path: "/verify-account",
      element: (
        <ProtectedRoute>
          <DefaultLayout>
            <VerifyAccount />
          </DefaultLayout>
        </ProtectedRoute>
      ),
    },
    {
      path: "/about",
      element: (
        <DefaultLayout>
          <About />
        </DefaultLayout>
      ),
      },
      {
        path: "/dashboard",
          element: (
        <VerifiedRoute>              
            <DefaultLayout>
                <Dashboard />
            </DefaultLayout>
        </VerifiedRoute>
        ),
    },
    {
      path: "/submission",
        element: (
      <VerifiedRoute>              
          <DefaultLayout>
              <SubmissionPage  />
          </DefaultLayout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/leaderboard",
        element: (
      <VerifiedRoute>              
          <DefaultLayout>
              <LeaderboardPage  />
          </DefaultLayout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/directory",
        element: (
      <VerifiedRoute>              
          <DefaultLayout>
              <DirectoryPage  />
          </DefaultLayout>
      </VerifiedRoute>
      ),
    },
    {
      path: "/profile",
        element: (
      <VerifiedRoute>              
          <DefaultLayout>
              <ProfilePage  />
          </DefaultLayout>
      </VerifiedRoute>
      ),
    },  
    {
      path: "/profile/:username",
      element: (
        <DefaultLayout>
          <ProfilePage />
        </DefaultLayout>
      ),
    },
    {
      path: "/admin",
      element: (
        <VerifiedAdminRoute>
          <DefaultLayout>
            <Admin />
          </DefaultLayout>
        </VerifiedAdminRoute>
      ),
    },
    {
      path: "/simulation",
      element: (
        <VerifiedAdminRoute>              
            <DefaultLayout>
                <SimulationPage  />
            </DefaultLayout>
        </VerifiedAdminRoute>
      ),
    },
    {
      path: "/container-manager",
      element: (
        <VerifiedAdminRoute>              
            <DefaultLayout>
                <ContainerManagerPage  />
            </DefaultLayout>
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

