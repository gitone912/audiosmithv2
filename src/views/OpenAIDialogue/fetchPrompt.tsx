// src/FetchPrompts.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase'; // Adjust the import based on your firebase setup
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


        console.log("Fetched and stored preferences:", {
          fetchedLanguage,
          fetchedVoice,
        });
      } else {
        console.error("No user found with that email.");
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    } finally {
      const language = (localStorage.getItem("userLanguage") || "English");
      if(language ===`English`){
        navigate('/dialogue'); 
      }
      else{
        navigate('/dialogue'); 

      }
      
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