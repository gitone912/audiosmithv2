import { Box, Button, Flex, useColorModeValue } from '@chakra-ui/react';
import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const activeButtonColor = useColorModeValue('white', 'white'); // Text color for active buttons
  const inactiveButtonColor = useColorModeValue('gray.500', 'gray.200'); // Text color for inactive buttons

  return (
    <Flex mb="6" justify="center" gap="4">
      {/* Profile Button */}
      <Button
        colorScheme="transparent"
        color={location.pathname === '/profile' ? activeButtonColor : inactiveButtonColor}
        fontWeight="bold"
        onClick={() => navigate('/profile')}
        p="0" // Remove padding from Button to rely on Box padding
      >
        <Box
          border="1px solid rgba(255, 255, 255, 0.2)"
          borderRadius="16px"
          px="20px"
          py="12px"
          bg={location.pathname === '/profile' ? 'rgb(80, 84, 72)' : 'transparent'}
        >
          Profile
        </Box>
      </Button>

      {/* Language Button */}
      <Button
        colorScheme="transparent"
        color={location.pathname === '/language' ? activeButtonColor : inactiveButtonColor}
        fontWeight="bold"
        onClick={() => navigate('/language')}
        p="0"
      >
        <Box
          border="1px solid rgba(255, 255, 255, 0.2)"
          borderRadius="16px"
          px="20px"
          py="12px"
          bg={location.pathname === '/language' ? 'rgb(80, 84, 72)' : 'transparent'}
        >
          Language
        </Box>
      </Button>

      {/* Voice Button */}
      <Button
        colorScheme="transparent"
        color={location.pathname === '/voice' ? activeButtonColor : inactiveButtonColor}
        fontWeight="bold"
        onClick={() => navigate('/voice')}
        p="0"
      >
        <Box
          border="1px solid rgba(255, 255, 255, 0.2)"
          borderRadius="16px"
          px="20px"
          py="12px"
          bg={location.pathname === '/voice' ? 'rgb(80, 84, 72)' : 'transparent'}
        >
          Voice
        </Box>
      </Button>

      {/* Therapy Type Button */}
      <Button
        colorScheme="transparent"
        color={location.pathname === '/therapy-type' ? activeButtonColor : inactiveButtonColor}
        fontWeight="bold"
        onClick={() => navigate('/therapy-type')}
        p="0"
      >
        <Box
          border="1px solid rgba(255, 255, 255, 0.2)"
          borderRadius="16px"
          px="20px"
          py="12px"
          bg={location.pathname === '/therapy-type' ? 'rgb(80, 84, 72)' : 'transparent'}
        >
          Therapy Type
        </Box>
      </Button>
    </Flex>
  );
}
