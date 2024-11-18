import React, { useState } from "react";
import {
  Box,
  Button,
  Textarea,
  VStack,
  Spinner,
  useColorModeValue,
  useToast,
  Icon,
  Flex,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { IoChevronBackOutline } from "react-icons/io5";

const CreateTypeJournal: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [newJournal, setNewJournal] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const boxBg = useColorModeValue("secondaryGray.300", "rgb(55, 60, 49)");
  const buttonBg = "#9ba192";
  const textColor = useColorModeValue("black", "white");
  

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!newJournal.trim()) {
      toast({
        title: "Error",
        description: "Journal content cannot be empty.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const collectionRef = collection(db, "typejournal");
      await addDoc(collectionRef, {
        user: user.email!,
        compiledJournal: newJournal,
        timestamp: Timestamp.now(),
      });

      toast({
        title: "Journal Created",
        description: "Your journal has been successfully created.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => navigate(-1), 2000);
    } catch (error) {
      console.error("Error creating the journal:", error);
      toast({
        title: "Error",
        description: "Failed to create the journal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box
      pt={{ base: "80px", md: "150px" }}
      textAlign="center"
      bg={boxBg}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      px={{ base: "4", md: "8" }}
    >
      {/* Back Button */}
      <Flex
        display={{ base: "flex", xl: "flex" }}
        alignItems="center"
        position="fixed"
        top="20px"
        left="20px"
        zIndex="10"
      >
        <Icon
          as={IoChevronBackOutline}
          color="white"
          w="24px"
          h="24px"
          _hover={{ cursor: "pointer" }}
          onClick={() => navigate(-1)}
        />
      </Flex>

      {/* Journal Input */}
      <VStack spacing={4} width="100%" maxW="600px" mx="auto">
  <Textarea
    value={newJournal}
    onChange={(e) => setNewJournal(e.target.value)}
    size="md"
    border="1px solid"
    borderColor={boxBg}
    height="600px" // Reduced height
    resize="vertical"
    borderRadius="16px" // Added curves to the corners
    placeholder="Start typing here..."
    bg="rgb(88, 94, 86)" // Background color update
    color="white" // Ensure text is visible
    _placeholder={{ color: "gray.300" }} // Placeholder styling
  />
  <Button
    bg={buttonBg}
    color="white"
    size="md"
    fontSize="md"
    borderRadius="12px" // Consistent rounded corners for the button
    onClick={handleSave}
    isLoading={isSaving}
  >
    Finish
  </Button>
</VStack>


      {/* Loading Spinner */}
      {isSaving && (
        <Box mt={4}>
          <Spinner size="lg" />
        </Box>
      )}
    </Box>
  );
};

export default CreateTypeJournal;
