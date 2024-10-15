// Chakra imports
import { Box, Flex, Text, Checkbox, useColorModeValue } from '@chakra-ui/react';
// Custom components
import Card from 'components/card/Card';

export default function Conversion(props: { [x: string]: any }) {
  const { ...rest } = props;

  // Chakra Color Mode
  const textColor = useColorModeValue('gray.700', 'gray.300'); // Softer text color
  const completedColor = useColorModeValue('gray.400', 'gray.500'); // Faded for completed tasks

  return (
    <Card
      p="30px"
      alignItems="flex-start"
      flexDirection="column"
      w="100%"
      maxW="400px"
      borderRadius="16px"
      bg={useColorModeValue('gray.100', 'rgb(82,87,76)')} // Match the card style
      {...rest}
    >
      <Text
        color={textColor}
        fontSize="lg"
        fontWeight="bold"
        mb="20px"
        textAlign="left"
        w="100%"
      >
        Action Recommendations
      </Text>

      <Box w="100%">
        {/* Task 1 - Completed */}
        <Flex alignItems="center" mb="15px">
          <Checkbox defaultChecked colorScheme="green" me="10px" />
          <Text
            as="s" // Strikethrough effect
            color={completedColor}
            fontSize="md"
            textAlign="left"
          >
            15 minute Call with Mom
          </Text>
        </Flex>

        {/* Task 2 - Completed */}
        <Flex alignItems="center" mb="15px">
          <Checkbox defaultChecked colorScheme="green" me="10px" />
          <Text
            as="s" // Strikethrough effect
            color={completedColor}
            fontSize="md"
            textAlign="left"
          >
            Reach out to a friend you haven’t spoken to in a while
          </Text>
        </Flex>

        {/* Task 3 */}
        <Flex alignItems="center" mb="15px">
          <Checkbox colorScheme="green" me="10px" />
          <Text fontWeight="medium" color={textColor} fontSize="md" textAlign="left">
            Coffee Date with Sheena
          </Text>
        </Flex>

        {/* Task 4 */}
        <Flex alignItems="center" mb="15px">
          <Checkbox colorScheme="green" me="10px" />
          <Text fontWeight="medium" color={textColor} fontSize="md" textAlign="left">
            Buy yourself a treat
          </Text>
        </Flex>

        {/* Task 5 */}
        <Flex alignItems="center" mb="15px">
          <Checkbox colorScheme="green" me="10px" />
          <Text fontWeight="medium" color={textColor} fontSize="md" textAlign="left">
            Meet my mentor
          </Text>
        </Flex>

        {/* Task 6 */}
        <Flex alignItems="center">
          <Checkbox colorScheme="green" me="10px" />
          <Text fontWeight="medium" color={textColor} fontSize="md" textAlign="left">
            List down 5 things you’re grateful about
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}
