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
    id: string;
    compiledJournal: string;
    timestamp: any;
    user: string; // Email of the user who created the journal
    originalText: string;
    date?: string;
    time?: string;
    type: "dialogue" | "monologue"; // Add type field
  }
  
  export default function Entries() {
    const textColor = useColorModeValue("gray.700", "white");
    const notebookBg = "rgba(255, 255, 102, 0.2)"; // Light yellow with low opacity
  
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [journalType, setJournalType] = useState<"all" | "monologue" | "dialogue">("all");
    const navigate = useNavigate();
  
    const formatTimestamp = (timestamp: any) => {
      const dateObj = new Date(timestamp.seconds * 1000);
      return {
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString(),
      };
    };
  
    const getCurrentUserEmail = () => {
      const userDetails = localStorage.getItem("userDetails");
      if (userDetails) {
        const parsedDetails = JSON.parse(userDetails);
        return parsedDetails.email || "";
      }
      return "";
    };
  
    const fetchJournals = async () => {
      setLoading(true);
      try {
        const currentUserEmail = getCurrentUserEmail();
        let journalData: Journal[] = [];
  
        if (journalType === "all" || journalType === "dialogue") {
          const dialogueSnapshot = await getDocs(collection(db, "chats"));
          journalData = journalData.concat(
            dialogueSnapshot.docs
              .map((doc) => {
                const data = doc.data();
                const { date, time } = formatTimestamp(data.timestamp);
                return {
                  ...data,
                  id: doc.id,
                  date,
                  time,
                  type: "dialogue",
                } as Journal;
              })
              .filter((journal) => journal.user === currentUserEmail)
          );
        }
  
        if (journalType === "all" || journalType === "monologue") {
          const monologueSnapshot = await getDocs(collection(db, "chat_monologue"));
          journalData = journalData.concat(
            monologueSnapshot.docs
              .map((doc) => {
                const data = doc.data();
                const { date, time } = formatTimestamp(data.timestamp);
                return {
                  ...data,
                  id: doc.id,
                  date,
                  time,
                  type: "monologue",
                } as Journal;
              })
              .filter((journal) => journal.user === currentUserEmail)
          );
        }
  
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
      if (selectedJournal) {
        navigate("/edit", {
          state: {
            id: selectedJournal.id,
            type: selectedJournal.type,
          },
        });
      }
    };
  
    return (
      <Box pt={{ base: "130px", md: "80px", xl: "80px" }} pl={{ base: 4, md: 10, lg: 20 }}>
        <Select
          value={journalType}
          onChange={(e) => setJournalType(e.target.value as "all" | "monologue" | "dialogue")}
          mb={4}
          w={{ base: "100%", md: "40%" }}
        >
          <option value="all">All</option>
          <option value="monologue">Monologue</option>
          <option value="dialogue">Dialogue</option>
        </Select>
  
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Spinner size="xl" />
          </Box>
        ) : journals.length > 0 ? (
          <SimpleGrid columns={{ base: 3, sm: 3, md: 4, lg: 5 }} spacing={4} p={4}>
            {journals.map((journal, index) => (
              <Box
                key={index}
                w={{ base: "100px", md: "130px", lg: "150px" }}
                h={{ base: "120px", md: "160px", lg: "180px" }}
                boxShadow="md"
                bg={notebookBg}
                position="relative"
                onClick={() => openJournal(journal)}
                cursor="pointer"
              >
                <Box
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
                    {journal.date} <br />
                    {journal.time}
                  </Text>
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <Text textAlign="center" mt={8} color={textColor}>
            No entries found.
          </Text>
        )}
  
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent maxW={{ base: "90%", md: "500px" }} p={4}>
            <ModalCloseButton />
            <ModalBody>
              <Text mt={4} fontSize="sm" color="gray.500">
                Date: {selectedJournal?.date}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Time: {selectedJournal?.time}
              </Text>
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
  