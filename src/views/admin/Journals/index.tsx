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
  color?: string;
  date?: string;
  time?: string;
  id: string;
}

export default function Journals() {
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("gray.100", "gray.700");
  const textColor = useColorModeValue("gray.700", "white");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [journalType, setJournalType] = useState<"all" | "monologue" | "dialogue">("all");
  const navigate = useNavigate();

  const getRandomColor = () => {
    const colors = ["red.200", "blue.200", "green.200", "yellow.200", "pink.200", "purple.200"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatTimestamp = (timestamp: any) => {
    const dateObj = new Date(timestamp.seconds * 1000);
    return {
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString(),
    };
  };

  const fetchJournals = async () => {
    setLoading(true);
    try {
      let journalData: Journal[] = [];

      if (journalType === "all" || journalType === "dialogue") {
        const dialogueSnapshot = await getDocs(collection(db, "chats"));
        journalData = journalData.concat(
          dialogueSnapshot.docs.map((doc) => {
            const data = doc.data();
            const { date, time } = formatTimestamp(data.timestamp);
            return {
              title: data.title || "",
              compiledJournal: data.compiledJournal || "",
              timestamp: data.timestamp || new Date(),
              user: data.user || "",
              originalText: data.originalText || "",
              id: doc.id,
              color: getRandomColor(),
              date,
              time,
            } as Journal;
          })
        );
      }

      if (journalType === "all" || journalType === "monologue") {
        const monologueSnapshot = await getDocs(collection(db, "chat_monologue"));
        journalData = journalData.concat(
          monologueSnapshot.docs.map((doc) => {
            const data = doc.data();
            const { date, time } = formatTimestamp(data.timestamp);
            return {
              title: data.title || "",
              compiledJournal: data.compiledJournal || "",
              timestamp: data.timestamp || new Date(),
              user: data.user || "",
              originalText: data.originalText || "",
              id: doc.id,
              color: getRandomColor(),
              date,
              time,
            } as Journal;
          })
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
    navigate("/edit", { state: { id: selectedJournal?.id, type: journalType } });
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} pl={{ base: 4, md: 10, lg: 20 }}>
      <Select
        value={journalType} // Set the default value to "all"
        onChange={(e) => setJournalType(e.target.value as "all" | "monologue" | "dialogue")}
        mb={4}
        w={{ base: "100%", md: "40%" }}
      >
        <option value="all">All</option> {/* Default option shown initially */}
        <option value="monologue">Monologue</option>
        <option value="dialogue">Dialogue</option>
      </Select>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <Spinner size="xl" />
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 3, sm: 3, md: 4, lg: 5 }} spacing={4} p={4}>
          {journals.map((journal, index) => (
            <Box
              key={index}
              w={{ base: "100px", md: "130px", lg: "150px" }}
              h={{ base: "170px", md: "240px", lg: "260px" }}
              boxShadow="md"
              position="relative"
              onClick={() => openJournal(journal)}
              cursor="pointer"
            >
              <Box
                bg={journal.color}
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
                  {journal.title}
                </Text>
              </Box>
              <Box mt={2} textAlign="center">
                <Text fontSize={{ base: "xx-small", md: "xs" }} color={textColor}>
                  {journal.date}
                </Text>
                <Text fontSize={{ base: "xx-small", md: "xs" }} color={textColor}>
                  {journal.time}
                </Text>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent maxW={{ base: "90%", md: "500px" }} p={4}>
          <ModalHeader fontSize={{ base: "lg", md: "xl" }}>{selectedJournal?.title}</ModalHeader>
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
