import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SignOut: React.FC = (): JSX.Element | null => {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove user details and image from localStorage
    localStorage.removeItem("userDetails");
    localStorage.removeItem("userImage");
    localStorage.removeItem("storageExpiry");

    // Redirect to the sign-in page, then reload it to ensure content is fully loaded
    navigate('/auth/sign-in', { replace: true });

    // Reload the page after navigating
    setTimeout(() => {
      window.location.reload();
    }, 100); // Small delay to ensure navigation completes

  }, [navigate]);

  return null; // Since it's just a redirect, no need to render anything
};

export default SignOut;
