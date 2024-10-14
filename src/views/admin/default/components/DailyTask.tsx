import React from 'react';
import { Box, Text, VStack, Badge, HStack, useColorModeValue } from '@chakra-ui/react';

interface Task {
  id: number;
  dayCount: number;
  description: string;
}

const tasks: Task[] = [
  { id: 1, dayCount: 21, description: '30 minutes of social media per day only' },
  { id: 2, dayCount: 37, description: 'No porn' },
  { id: 3, dayCount: 57, description: '10-minute meditation' },
  { id: 4, dayCount: 42, description: '30-minute walk' },
];

export default function DailyTask() {
  const textColor = useColorModeValue('gray.900', 'gray.100'); // Adjusted for light/dark mode

  return (
    <Box
      w="100%"
      h="40vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      pt="10"
      bg="transparent" // Transparent background
      color={textColor}
    >
      <Text fontSize="2xl" fontWeight="bold" mb="5">
        Daily Streak Counter
      </Text>

      <VStack spacing="4" align="stretch" w="80%" maxW="400px">
        {tasks.map((task) => (
          <HStack key={task.id} justifyContent="start" spacing="4">
            <Badge
              fontSize="2xl"
              colorScheme="teal"
              borderRadius="md"
              px="6"
              py="3"
            >
              {task.dayCount}
            </Badge>
            <Text fontSize="lg" fontWeight="medium">
              {task.description}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
