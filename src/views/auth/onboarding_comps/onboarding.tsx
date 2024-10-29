import React, { useState } from "react";
import { Box, Button, Image, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

// Import each image directly
import img1 from "assets/img/OnboardingImages/79.png";
import img2 from "assets/img/OnboardingImages/80.png";
import img3 from "assets/img/OnboardingImages/81.png";
import img4 from "assets/img/OnboardingImages/82.png";
import img5 from "assets/img/OnboardingImages/83.png";

const images = [img1, img2, img3, img4, img5];

function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate("/auth/choose-cover"); // Set your next page route here
    }
  };

  return (
    <Box width="100vw" height="100vh" overflow="hidden" position="relative">
      <Image
        src={images[currentIndex]}
        alt={`Onboarding image ${currentIndex + 1}`}
        objectFit="cover"
        width="100%"
        height="100%"
      />
      <Flex
        position="absolute"
        bottom="95px"
        width="100%"
        justifyContent={currentIndex > 0 ? "flex-end" : "center"} // Adjust alignment based on page
        pr={currentIndex > 0 ? "530px" : "0"} // Add right padding only from 2nd page onward
        alignItems="center"
      >
        <Button
          onClick={handleNext}
          backgroundColor="rgb(133,135,115)" // Button background color
          color="white"
          borderRadius="30px" // Rounded edges
          px="45px" // Increased horizontal padding for a wider button
          py="26px" // Increased vertical padding for a taller button
          fontSize="xl" // Larger font size
          fontWeight="bold" // Bold text
          _hover={{ bg: "#5A5F56" }} // Keeps color consistent on hover
        >
          Next
        </Button>
      </Flex>
    </Box>
  );
}

export default Onboarding;
