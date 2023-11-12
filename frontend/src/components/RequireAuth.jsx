import { useLocation, Navigate, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function getJwt() {
  const jwt = localStorage.getItem("jwt");
  if (jwt) {
    return jwtDecode(jwt);
  }

  return false;
}

export function getUserId() {
  const jwt = getJwt();
  if (jwt) {
    return jwt.user_id;
  }

  return false;
}

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
  const jwt = getJwt();
  if (allowedRoles) {
    if (jwt) {
      isAllowed = hasMatchingRole(allowedRoles, jwt.roles);
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
