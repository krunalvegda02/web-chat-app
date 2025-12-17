import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { fetchMe, setInitialized, clearAuth } from "./redux/slices/authSlice";
import { pageRoutes } from "./routes/pageRoutes";
import ProtectedRoute from "./routes/protectedRoutes";
import LoadingSpinner from "./components/common/LoadingSpinner";

function AppContent() {
  const dispatch = useDispatch();
  const { initialized, token, user } = useSelector((s) => s.auth);

  // -------------------------------
  // INITIAL AUTH CHECK
  // -------------------------------
  useEffect(() => {
    if (token && !initialized) {
      dispatch(fetchMe())
        .unwrap()
        .catch(() => dispatch(clearAuth()));
    } else if (!token && !initialized) {
      dispatch(setInitialized());
    }
  }, [dispatch, token, initialized]);

  if (!initialized) return <LoadingSpinner fullScreen />;

  // If not logged in → redirect except auth pages
  const publicPaths = ["/login", "/register", "/reset-password", "/join/"];
  const currentPath = window.location.pathname;

  if (
    initialized &&
    !user &&
    !publicPaths.some((p) => currentPath.startsWith(p))
  ) {
    return <Navigate to="/login" replace />;
  }

  // -------------------------------
  // RENDER ROUTES
  // -------------------------------
  return (
    <Routes>
      {pageRoutes.map(({ layout: Layout, routes, requiredRoles }, i) => (
        <Route
          key={i}
          element={
            requiredRoles ? (
              <ProtectedRoute requiredRoles={requiredRoles}>
                {Layout ? <Layout /> : <></>}
              </ProtectedRoute>
            ) : Layout ? (
              <Layout />
            ) : (
              <></>
            )
          }
        >
          {routes.map((route, idx) => (
            <Route key={idx} path={route.path} element={<route.element />} />
          ))}
        </Route>
      ))}
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
