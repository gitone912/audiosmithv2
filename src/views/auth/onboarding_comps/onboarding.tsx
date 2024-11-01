import React, { useState, useEffect } from "react";
import { Box, Button, Image, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

// Import each image directly
import img1 from "assets/img/OnboardingImages/79.png";
import img2 from "assets/img/OnboardingImages/80.png";
import img3 from "assets/img/OnboardingImages/81.png";
import img4 from "assets/img/OnboardingImages/82.png";
import img5 from "assets/img/OnboardingImages/83.png";

const images = [img1, img2, img3, img4, img5];

// Helper function to preload an image
const preloadImage = (src: string) => {
  return new Promise<void>((resolve) => {
    const img = new window.Image(); // Correct usage of Image constructor in the browser environment
    img.src = src;
    img.onload = () => resolve();
  });
};

function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Preload all images initially
    Promise.all(images.map((src) => preloadImage(src))).then(() => {
      // Once all images are preloaded, set initial loading state
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    // Set loading state until the current and next images are fully loaded
    setIsLoading(true);

    // Load current and next image if available
    preloadImage(images[currentIndex]).then(() => {
      if (currentIndex < images.length - 1) {
        preloadImage(images[currentIndex + 1]).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
  }, [currentIndex]);

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
        justifyContent={currentIndex > 0 ? "flex-end" : "center"}
        pr={currentIndex > 0 ? "530px" : "0"}
        alignItems="center"
      >
        <Button
          onClick={handleNext}
          backgroundColor="rgb(133,135,115)"
          color="white"
          borderRadius="30px"
          px="45px"
          py="26px"
          fontSize="xl"
          fontWeight="bold"
          _hover={{ bg: "#5A5F56" }}
          disabled={isLoading} // Disable button until the image is loaded
        >
          Next
        </Button>
      </Flex>
    </Box>
  );
}

export default Onboarding;
