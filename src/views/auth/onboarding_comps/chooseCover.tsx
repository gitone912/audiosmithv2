import React, { useEffect, useState } from "react";
import { Box, Image, Flex, Text } from "@chakra-ui/react";
import { db } from "../../../firebase"; // Adjust the import path as needed
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import mainImage from "assets/img/OnboardingImages/84.png";
import cover1 from "assets/img/Journal Covers/1.png";
import cover2 from "assets/img/Journal Covers/2.png";
import cover3 from "assets/img/Journal Covers/3.png";
import cover4 from "assets/img/Journal Covers/4.png";

const ChooseCover = () => {
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const covers = [
    { id: "cover1", img: cover1 },
    { id: "cover2", img: cover2 },
    { id: "cover3", img: cover3 },
    { id: "cover4", img: cover4 },
  ];

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (userDetails && userDetails.email) {
      fetchUserId(userDetails.email);
    }
  }, []);

  const fetchUserId = async (email:any) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        setUserId(doc.id);
      });
    }
  };

  const handleCoverSelect = async (coverId: any) => {
    if (userId) {
      console.log('saving');
      try {
        await saveCoverToDB(coverId);
        navigate("../../admin/session"); // Navigate to the specified route
        window.location.reload(); // Reload the page after navigation
      } catch (error) {
        console.error("Error saving cover selection:", error);
      }
    }
  };
  
  const saveCoverToDB = async (coverId:any) => {
    const userDocRef = doc(db, `users/${userId}`);
    
    try {
      // Update Firestore with selected cover and onboarding status
      await setDoc(userDocRef, { selectedCover: coverId, onboarding: true }, { merge: true });
      console.log(`Cover selection (${coverId}) and onboarding status saved successfully!`);
    } catch (error) {
      console.error("Error saving cover selection:", error);
    }
  };

  return (
    <Box width="100vw" height="100vh" overflow="hidden" position="relative">
      <Image
        src={mainImage}
        alt="Background"
        objectFit="cover"
        width="100%"
        height="100%"
        position="absolute"
        top="0"
        left="0"
        zIndex="0"
      />
      
      <Flex
        direction="column"
        alignItems="center"
        justifyContent="center"
        position="absolute"
        width="100%"
        height="100%"
        zIndex="1"
        color="white"
        textAlign="center"
        px={4}
      >
        <Text fontSize="2xl" fontWeight="bold" mb={6}>
          Choose a cover for your journal.
        </Text>

        <Flex justifyContent="center" gap={6}>
          {covers.map((cover, index) => (
            <Image
              key={index}
              src={cover.img}
              alt={`Journal cover ${index + 1}`}
              width="150px"
              height="200px"
              objectFit="cover"
              boxShadow="lg"
              borderRadius="md"
              cursor="pointer"
              _hover={{ transform: "scale(1.05)" }}
              transition="transform 0.2s"
              onClick={() => handleCoverSelect(cover.id)} // Pass cover identifier
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
};

export default ChooseCover;
