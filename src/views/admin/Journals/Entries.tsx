import {
    Box,
    SimpleGrid,
    Text,
    useColorModeValue,
    Select,
    Spinner,
    Flex,
    Icon,
    Image,
  } from "@chakra-ui/react";
  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { collection, getDocs } from "firebase/firestore";
  import { db } from "../../../firebase";
  import { IoChevronBackOutline } from "react-icons/io5";
  import PaperImg from "assets/img/Journal Covers/Paper.png";
  
  // Define the Journal type
  interface Journal {
    id: string;
    compiledJournal: string;
    timestamp: any;
    user: string; // Email of the user who created the journal
    originalText: string;
    date?: string;
    time?: string;
    type: "dialogue" | "monologue" | "typejournal" | "typechatjournal"; // Add type field
  }
  
  export default function Entries() {
    const textColor = useColorModeValue("gray.700", "white");
    const notebookBg = "rgba(255, 255, 102, 0.2)"; // Light yellow with low opacity
  
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [journalType, setJournalType] = useState<"all" | "monologue" | "dialogue" | "typejournal" | "typechatjournal">("all");
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
          const currentUserEmail = getCurrentUserEmail(); // Ensure this function gets the correct user email
          let journalData: Journal[] = [];
          console.log("Current User:", currentUserEmail); // Debugging
      
          // Fetch dialogue journals
          if (journalType === "all" || journalType === "dialogue") {
            const dialogueSnapshot = await getDocs(collection(db, "chats"));
            console.log("Fetched dialogue journals:", dialogueSnapshot.docs.length); // Debugging
      
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
      
          // Fetch monologue journals
          if (journalType === "all" || journalType === "monologue") {
            const monologueSnapshot = await getDocs(collection(db, "chat_monologue"));
            console.log("Fetched monologue journals:", monologueSnapshot.docs.length); // Debugging
      
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
      
          // Fetch typejournal entries
          if (journalType === "all" || journalType === "typejournal") {
            const typeJournalSnapshot = await getDocs(collection(db, "typejournal"));
            console.log("Fetched typejournal entries:", typeJournalSnapshot.docs.length); // Debugging
      
            journalData = journalData.concat(
              typeJournalSnapshot.docs
                .map((doc) => {
                  const data = doc.data();
                  const { date, time } = formatTimestamp(data.timestamp);
                  return {
                    ...data,
                    id: doc.id,
                    date,
                    time,
                    type: "typejournal",
                  } as Journal;
                })
                .filter((journal) => journal.user === currentUserEmail)
            );
          }
      
          // Fetch typechatjournal entries
          if (journalType === "all" || journalType === "typechatjournal") {
            const typeChatJournalSnapshot = await getDocs(collection(db, "typechatjournal"));
            console.log("Fetched typechatjournal entries:", typeChatJournalSnapshot.docs.length); // Debugging
      
            journalData = journalData.concat(
              typeChatJournalSnapshot.docs
                .map((doc) => {
                  const data = doc.data();
                  const { date, time } = formatTimestamp(data.timestamp);
                  return {
                    ...data,
                    id: doc.id,
                    date,
                    time,
                    type: "typechatjournal",
                  } as Journal;
                })
                .filter((journal) => journal.user === currentUserEmail)
            );
          }
      
          console.log("Total journals fetched:", journalData.length); // Debugging
      
          // Sort journal entries in descending order by timestamp
          journalData.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      
          setJournals(journalData);
        } catch (error) {
          console.error("Error fetching journals:", error);
        }
      
        setLoading(false);
      };
      
  
    const openJournal = (journal: Journal) => {
        // Directly navigate to the edit page with the journal's id and type
        navigate("/edit", {
            state: {
                id: journal.id,
                type: journal.type,
            },
        });
    };
    useEffect(() => {
        fetchJournals();
    }, [journalType]);
    return (
        <Box pt={{ base: "130px", md: "80px", xl: "80px" }} pl={{ base: 4, md: 10, lg: 20 }}>
            <Flex
                display={{ sm: 'flex', xl: 'flex' }}
                alignItems="center"
                position="fixed"
                top="20px"
                left="20px"
                zIndex="10"
            >
                <Icon
                    as={IoChevronBackOutline}
                    color='white'
                    w="24px"
                    h="24px"
                    _hover={{ cursor: 'pointer' }}
                    onClick={() => navigate(-1)} // Navigate to the previous page
                />
            </Flex>
            <Select
  value={journalType}
  onChange={(e) =>
    setJournalType(e.target.value as "all" | "monologue" | "dialogue" | "typejournal" | "typechatjournal")
  }
  mb={4}
  w={{ base: "100%", md: "40%" }}
>
                <option value="all">All</option>
                <option value="monologue">Monologue</option>
                <option value="dialogue">Dialogue</option>
                <option value="typejournal">Type</option>
                <option value="typechatjournal">Chat</option>
            </Select>
  
            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                    <Spinner size="xl" />
                </Box>
            ) : journals.length > 0 ? (
                <SimpleGrid columns={{ base: 3, sm: 3, md: 4, lg: 7 }} spacing={4} p={4}>
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
                            <Image
                                src={PaperImg}
                                alt={`Journal entry ${index + 1}`}
                                boxSize="100%"
                                borderRadius="md"
                                objectFit="cover"
                                _hover={{ transform: "scale(1.05)" }}
                                transition="transform 0.2s"
                            />
                            <Box
                                position="absolute"
                                top="50%"
                                left="50%"
                                transform="translate(-50%, -50%)"
                                bg="transparent"
                                borderRadius="md"
                                textAlign="center"
                                p={2}
                            >
                                <Text
                                    color="black"
                                    fontWeight="normal"
                                    fontSize="sm"
                                >
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
        </Box>
    );
  }
  