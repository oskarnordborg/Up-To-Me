import { useLocation, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function hasMatchingRole(allowedRoles, userRoles) {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  for (let i = 0; i < allowedRoles.length; i++) {
    if (userRoles.indexOf(allowedRoles[i]) !== -1) {
      return true;
    }
  }

  return false;
}

const RequireAuth = ({ allowedRoles, unauthorizedComponent = null }) => {
  const location = useLocation();

  let isAllowed = true;
  const decodedToken = undefined;
  const jwt = localStorage.getItem("jwt");
  if (allowedRoles) {
    if (jwt) {
      const decodedToken = jwtDecode(jwt);

      isAllowed = hasMatchingRole(allowedRoles, decodedToken.roles);
    } else {
      isAllowed = false;
    }
  }

  return isAllowed ? (
    <Outlet />
  ) : decodedToken ? (
    <Navigate to="/unauthorized" state={{ from: location }} replace />
  ) : (
    unauthorizedComponent || (
      <Navigate to="/login" state={{ from: location }} replace />
    )
  );
};

export default RequireAuth;
