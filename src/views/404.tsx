// src/views/404.tsx
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      textAlign="center"
      py={10}
      px={6}
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6}>
        <Heading as="h1" size="2xl">
          404
        </Heading>
        <Text fontSize="lg" color="gray.500">
          Oops! The page you're looking for doesn't exist.
        </Text>
        <Button
          colorScheme="teal"
          onClick={() => navigate('/')}
        >
          Go Home
        </Button>
      </VStack>
    </Box>
  );
}
