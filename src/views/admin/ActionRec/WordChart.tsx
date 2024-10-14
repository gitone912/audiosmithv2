import React from 'react';
// Chakra UI imports
import { Box, Text, useColorModeValue } from '@chakra-ui/react';
import { TagCloud } from 'react-tagcloud';

const data = [
  { value: 'Anxiety', count: 80 },
  { value: 'Hope', count: 70 },
  { value: 'Frustration', count: 60 },
  { value: 'Excitement', count: 55 },
  { value: 'Love', count: 50 },
  { value: 'Sadness', count: 45 },
  { value: 'Contentment', count: 40 },
  { value: 'Gratitude', count: 35 },
  { value: 'Anger', count: 30 },
  { value: 'Joy', count: 25 },
  { value: 'Envy', count: 20 },
  { value: 'Fear', count: 20 },
  { value: 'Pride', count: 75 },
  { value: 'Boredom', count: 15 },
  { value: 'Guilt', count: 10 },
  { value: 'Loneliness', count: 10 },
  { value: 'Shame', count: 5 },
];

export default function WordChart(props: any) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" w="100%" {...props}>
      <Text
        fontSize="lg"
        fontWeight="bold"
        mb="4"
        color={useColorModeValue('gray.700', 'gray.200')}
        textAlign="center" // Center text
      >
        You are anxious yet hopeful these days. You’re frustrated with work, but your connection with your partner helps you go through it.
      </Text>
      <Box 
        display="flex" 
        justifyContent="center" // Center the TagCloud
        alignItems="center"
        w="400px" 
        h="200px"
      >
        <TagCloud
          minSize={12}
          maxSize={35}
          tags={data}
          colorOptions={{
            luminosity: 'light',
            hue: 'blue',
          }}
        />
      </Box>
    </Box>
  );
}
