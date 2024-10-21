import { Box, Text, useColorModeValue,SimpleGrid, } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function Journals() {
  const navigate = useNavigate();
  const textColor = useColorModeValue("gray.700", "white");

  const handleBookClick = () => {
    navigate("/../entries");
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} pl={{ base: 4, md: 10, lg: 20 }}>
    
    <SimpleGrid columns={{ base: 3, sm: 3, md: 4, lg: 5 }} spacing={4} p={4}>
      
              <Box
                 w={{ base: "100px", md: "130px", lg: "150px" }}
                 h={{ base: "120px", md: "160px", lg: "180px" }}
                boxShadow="md"
                position="relative"
                onClick={() => handleBookClick()}
                cursor="pointer"
              >
                <Box
                  bg='navy.300'
                  h={{ base: "120px", md: "160px", lg: "180px" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  border="1px solid"
                  borderRadius="0px"
                  pl="16px"
                  position="relative"
                >
                  <Box position="absolute" top="0" left="8px" h="100%" w="1px" bg="white" />
                  <Text color={textColor} fontWeight="bold" fontSize={{ base: "xs", md: "sm", lg: "md" }}>
                    Reflections
                  </Text>
                </Box>
               
              </Box>
          </SimpleGrid>
          </Box>
  );
}
