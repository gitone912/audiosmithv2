import { Box, SimpleGrid, Text, useColorModeValue, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';

// Define the Journal type
interface Journal {
  title: string;
  content: string;
  color: string;
  date: string;
  time: string;
}

export default function Journals() {
  // Chakra Color Mode
  const brandColor = useColorModeValue('brand.500', 'white');
  const boxBg = useColorModeValue('gray.100', 'gray.700'); // Adjust as needed
  const textColor = useColorModeValue('gray.700', 'white');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null); // Use the Journal type

  const journals: Journal[] = [
    { title: 'Reflections', content: 'Content of Reflections', color: 'gray.300', date: 'Oct 12, 2024', time: '4:00 PM' },
    { title: 'Travel', content: 'Content of Travel Journal', color: 'pink.200', date: 'Sep 22, 2024', time: '10:30 AM' },
    { title: 'Journal 3', content: 'Content of Journal 3', color: 'blue.200', date: 'Aug 18, 2024', time: '2:15 PM' },
    { title: 'Journal 4', content: 'Content of Journal 4', color: 'yellow.300', date: 'Jul 10, 2024', time: '9:00 AM' },
    { title: 'Journal 5', content: 'Content of Journal 5', color: 'green.200', date: 'Jun 5, 2024', time: '11:45 AM' },
    { title: 'Journal 6', content: 'Content of Journal 6', color: 'yellow.300', date: 'Jul 10, 2024', time: '9:00 AM' },
    { title: 'Journal 7', content: 'Content of Journal 7', color: 'green.200', date: 'Jun 5, 2024', time: '11:45 AM' },
    // Add more journals here as needed
  ];

  const openJournal = (journal: Journal) => {
    setSelectedJournal(journal); // Set the clicked journal as the selected one
    onOpen();
  };

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
            h={{ base: '170px', md: '240px', lg: '260px' }} // Responsive height
            boxShadow="md"
            position="relative"
            onClick={() => openJournal(journal)}  // Open the journal modal on click
            cursor="pointer" // Makes the journal clickable
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
              pl="16px"  // Increased left padding to adjust content inside
              position="relative" // For left margin positioning
            >
              {/* Left Margin Line */}
              <Box 
                position="absolute" 
                top="0" 
                left="8px"  // Moves the margin line slightly inside
                h="100%" 
                w="1px"  // Width of the margin line
                bg="white" // Color of the margin line
              />

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

      {/* Modal to show the selected journal's content */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>{selectedJournal?.title}</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      <Text>{selectedJournal?.content}</Text>
      <Text mt={4} fontSize="sm" color="gray.500">
        Date: {selectedJournal?.date}
      </Text>
      <Text fontSize="sm" color="gray.500">
        Time: {selectedJournal?.time}
      </Text>
    </ModalBody>
  </ModalContent>
</Modal>

    </Box>
  );
}
