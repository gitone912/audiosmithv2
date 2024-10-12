// Chakra imports
import { Box, SimpleGrid, Text, useColorModeValue } from '@chakra-ui/react';

export default function Journals() {
  // Chakra Color Mode
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('gray.100', 'gray.700'); // Adjust as needed
  const textColor = useColorModeValue('gray.700', 'white');

  const journals = [
    { title: 'Reflections', color: 'gray.300', date: 'Oct 12, 2024', time: '4:00 PM' },
    { title: 'Travel', color: 'pink.200', date: 'Sep 22, 2024', time: '10:30 AM' },
    { title: 'Journal 3', color: 'blue.200', date: 'Aug 18, 2024', time: '2:15 PM' },
    { title: 'Journal 4', color: 'yellow.300', date: 'Jul 10, 2024', time: '9:00 AM' },
    { title: 'Journal 5', color: 'green.200', date: 'Jun 5, 2024', time: '11:45 AM' },
    { title: 'Journal 6', color: 'yellow.300', date: 'Jul 10, 2024', time: '9:00 AM' },
    { title: 'Journal 7', color: 'green.200', date: 'Jun 5, 2024', time: '11:45 AM' },
    // Add more journals here as needed
  ];

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} pl={{ base: 4, md: 10, lg: 20 }}>
      <SimpleGrid 
        columns={{ base: 3, sm: 3, md: 4, lg: 5 }}  // Adjust columns based on screen size
        spacing={4} // Adjust spacing between boxes
        p={4}
      >
        {journals.map((journal, index) => (
          <Box 
            key={index} 
            w={{ base: '100px', md: '130px', lg: '150px' }} // Responsive width
            h={{ base: '160px', md: '220px', lg: '240px' }} // Responsive height
            boxShadow="md"
          >
            {/* Main Journal Box */}
            <Box
              bg={journal.color}
              h={{ base: '120px', md: '160px', lg: '180px' }} // Adjust height of box
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="1px solid"
              borderRadius="0px"  // Sharp edges
            >
              <Text 
                color={textColor} 
                fontWeight="bold" 
                fontSize={{ base: 'xs', md: 'sm', lg: 'md' }} // Adjust font size
              >
                {journal.title}
              </Text>
            </Box>
            {/* Date & Time Section */}
            <Box mt={2} textAlign="center">
              <Text fontSize={{ base: 'xx-small', md: 'xs' }} color={textColor}>
                {journal.date}
              </Text>
              <Text fontSize={{ base: 'xx-small', md: 'xs' }} color={textColor}>
                {journal.time}
              </Text>
            </Box>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
