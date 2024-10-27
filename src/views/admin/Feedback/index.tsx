// feedback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // If using react-router

const Feedback: React.FC = () => {
  const navigate = useNavigate(); // For routing (if using react-router)

  useEffect(() => {
    // Redirect to Google Form link after mounting
    window.location.href = 'https://audiosmith.me/feedback';
  }, []);

  return (
    <div>
      <h2>Redirecting to Feedback Form...</h2>
      <p>If you are not redirected, <a href="https://audiosmith.me/feedback">click here</a>.</p>
    </div>
  );
};

export default Feedback;
