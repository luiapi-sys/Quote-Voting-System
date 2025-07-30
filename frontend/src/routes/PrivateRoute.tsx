import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../hooks/useAuth";
import { JSX } from "react";

export default function PrivateRoute({ children }: { children: JSX.Element }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}
