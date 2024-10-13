import {
  Box,
  SimpleGrid,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Select,
  Spinner,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; 

// Define the Journal type
interface Journal {
  title: string;
  compiledJournal: string;
  timestamp: any;
  user: string;
  originalText: string;
  color?: string; // Add color property
  date?: string;  // Adding date & time props for display
  time?: string;
  id: string;     // Add id property to the Journal type
}

export default function Journals() {
  // Chakra Color Mode
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.700", "white");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [journalType, setJournalType] = useState<"monologue" | "dialogue">("monologue");
  const navigate = useNavigate();

  // Helper to generate random colors
  const getRandomColor = () => {
    const colors = ["red.200", "blue.200", "green.200", "yellow.200", "pink.200", "purple.200"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Helper to format timestamp into date and time strings
  const formatTimestamp = (timestamp: any) => {
    const dateObj = new Date(timestamp.seconds * 1000);
    return {
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString(),
    };
  };

  // Fetch journals from Firestore
  const fetchJournals = async () => {
    setLoading(true);
    try {
      const collectionName = journalType === "dialogue" ? "chats" : "chat_monologue";
      const querySnapshot = await getDocs(collection(db, collectionName));
      

      const journalData: Journal[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const { date, time } = formatTimestamp(data.timestamp);
        return {
          title: data.title || "",
          compiledJournal: data.compiledJournal || "",
          timestamp: data.timestamp || new Date(),
          user: data.user || "",
          originalText: data.originalText || "",
          id: doc.id,
          color: getRandomColor(), // Assign random color
          date,  // Add formatted date
          time,  // Add formatted time
        } as Journal;
      });

      setJournals(journalData);
    } catch (error) {
      console.error("Error fetching journals: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJournals();
  }, [journalType]);

  const openJournal = (journal: Journal) => {
    setSelectedJournal(journal);
    onOpen();
  };

  const handleEditClick = () => {
    console.log("Navigating to edit with ID:", selectedJournal?.id, "Type:", journalType);
    navigate("/edit", { state: { id: selectedJournal?.id, type: journalType } });
  };
  
  
  

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} pl={{ base: 4, md: 10, lg: 20 }}>
      <Select
        placeholder="Select Journal Type"
        onChange={(e) => setJournalType(e.target.value as "monologue" | "dialogue")}
        mb={4}
        w={{ base: "100%", md: "40%" }}
      >
        <option value="monologue">Monologue</option>
        <option value="dialogue">Dialogue</option>
      </Select>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Box>
      ) : (
        <SimpleGrid 
          columns={{ base: 3, sm: 3, md: 4, lg: 5 }}  // Responsive columns
          spacing={4} 
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
              cursor="pointer" 
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
                pl="16px"  
                position="relative" 
              >
                {/* Left Margin Line */}
                <Box 
                  position="absolute" 
                  top="0" 
                  left="8px"  
                  h="100%" 
                  w="1px"  
                  bg="white" 
                />

                <Text 
                  color={textColor} 
                  fontWeight="bold" 
                  fontSize={{ base: 'xs', md: 'sm', lg: 'md' }} 
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
      )}

      {/* Modal to show the selected journal's content */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW={{ base: '90%', md: '500px' }} p={4}>
          <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>{selectedJournal?.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Date & Time */}
            <Text mt={4} fontSize="sm" color="gray.500">
              Date: {selectedJournal?.date}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Time: {selectedJournal?.time}
            </Text>
            {/* Edit Button */}
            <Box textAlign="center" mt={4}>
              <Button colorScheme="blue" onClick={handleEditClick}>
                Edit
              </Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
