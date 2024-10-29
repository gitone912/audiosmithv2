import React, { useEffect, useState } from "react";
import { Box, Text, useColorModeValue, SimpleGrid, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { db } from "../../../firebase"; // Adjust this path as needed
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import cover1 from "assets/img/Journal Covers/1.png";
import cover2 from "assets/img/Journal Covers/2.png";
import cover3 from "assets/img/Journal Covers/3.png";
import cover4 from "assets/img/Journal Covers/4.png";

export default function Journals() {
  const [selectedCover, setSelectedCover] = useState<keyof typeof coverImages | null>(null);
  const navigate = useNavigate();
  const textColor = useColorModeValue("gray.700", "white");

  // Cover options with identifiers matching Firestore values
  const coverImages = {
    cover1: cover1,
    cover2: cover2,
    cover3: cover3,
    cover4: cover4,
  };

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem("userDetails"));
    if (userDetails && userDetails.email) {
      fetchUserCover(userDetails.email);
    }
  }, []);

  const fetchUserCover = async (email:any) => {
    // Query Firestore to find user by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      setSelectedCover(userData.selectedCover); // Get the selected cover ID
    }
  };

  const handleBookClick = () => {
    navigate("/../entries");
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} pl={{ base: 4, md: 10, lg: 20 }}>
      <Text fontSize="2xl" fontWeight="bold" color={textColor} mb={4}>
        Journals
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4} p={4}>
        {selectedCover && (
          <Image
            src={coverImages[selectedCover]} // Use the selected cover from Firestore
            alt={`Journal cover`}
            width="150px"
            height="200px"
            objectFit="cover"
            boxShadow="lg"
            borderRadius="md"
            cursor="pointer"
            _hover={{ transform: "scale(1.05)" }}
            transition="transform 0.2s"
            onClick={handleBookClick}
          />
        )}
      </SimpleGrid>
    </Box>
  );
}
