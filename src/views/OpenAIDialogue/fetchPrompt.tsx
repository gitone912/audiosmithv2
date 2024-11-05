// src/FetchPrompts.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust the import based on your firebase setup
import { getPrompt } from './utils/system'; // Adjust based on your actual path
import { Box, Spinner } from '@chakra-ui/react';

const FetchPrompts = () => {
  const navigate = useNavigate();

  const fetchUserPreferences = async (email: string) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        const fetchedLanguage = userDoc.language || "english";
        const fetchedVoice = userDoc.voice || "sage";

        // Store preferences in local storage
        localStorage.setItem("userLanguage", fetchedLanguage);
        localStorage.setItem("userVoice", fetchedVoice);

        // Fetch SYSTEM_MESSAGE and store it
        const systemMessage = getPrompt(fetchedLanguage);
        localStorage.setItem("systemMessage", systemMessage);

        console.log("Fetched and stored preferences:", {
          fetchedLanguage,
          fetchedVoice,
          systemMessage,
        });
      } else {
        console.error("No user found with that email.");
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    } finally {
      // Navigate to the main dialogue page after fetching
      navigate('/dialogue-new'); // Change '/dialogue' to your desired path
    }
  };

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails") || '{}');
    if (userDetails && userDetails.email) {
      fetchUserPreferences(userDetails.email);
    } else {
      console.error("Error: User details missing");
      // Optionally navigate to an error page or back to login
      navigate('/login'); // Adjust as necessary
    }
  }, [navigate]);

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Spinner size="xl" color="teal.500" />
        </Box>
  ); // You can add a loading spinner or message here
};

export default FetchPrompts;
