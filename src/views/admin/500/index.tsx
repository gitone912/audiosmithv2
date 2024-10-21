// LockedPage.tsx
import { Box, Center, Icon, SimpleGrid, Text } from "@chakra-ui/react";
import { LockIcon } from "@chakra-ui/icons";

const LockedPage: React.FC = () => {
  return (
    <Box
    pt={{ base: '150px', md: '330px', xl: '330px' }}
    textAlign="center"
    minHeight="100vh"
    display="flex"
    justifyContent="center"
    alignItems="flex-start"
  >
        <Icon as={LockIcon} boxSize={12} color="red.500" mb={4} />
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Locked
        </Text>
      </Box>
  );
};

export default LockedPage;
