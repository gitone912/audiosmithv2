// Chakra imports
import { Box, Flex, Text, Icon, useColorModeValue, Checkbox } from '@chakra-ui/react';
// Custom components
import Card from 'components/card/Card';
import Menu from 'components/menu/MainMenu';
import IconBox from 'components/icons/IconBox';

// Assets
import { MdCheckBox, MdDragIndicator } from 'react-icons/md';

export default function Conversion(props: { [x: string]: any }) {
  const { ...rest } = props;

  // Chakra Color Mode
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const brandColor = useColorModeValue('brand.500', 'brand.400');

  return (
    <Card
      p="20px"
      alignItems="center"
      flexDirection="column"
      w="100%"
      bg="transparent" // Transparent background for the Card
      boxShadow="none" // Remove box shadow if needed
      {...rest}
    >
      <Flex alignItems="center" w="100%" mb="30px">
        <IconBox
          me="12px"
          w="38px"
          h="38px"
          bg="transparent" // Transparent background for IconBox
          icon={<Icon as={MdCheckBox} color={brandColor} w="24px" h="24px" />}
        />

        <Text color={textColor} fontSize="lg" fontWeight="700">
          Action Recommendation
        </Text>
      </Flex>

      <Box px="11px" w="100%">
        {/* Task 1 */}
        <Flex w="100%" justify="space-between" mb="20px">
          <Checkbox me="16px" colorScheme="brandScheme" />
          <Text fontWeight="bold" color={textColor} fontSize="md" textAlign="start">
            Landing Page Design
          </Text>
          <Icon ms="auto" as={MdDragIndicator} color="secondaryGray.600" w="24px" h="24px" />
        </Flex>

        {/* Task 2 */}
        <Flex w="100%" justify="space-between" mb="20px">
          <Checkbox me="16px" defaultChecked colorScheme="brandScheme" />
          <Text fontWeight="bold" color={textColor} fontSize="md" textAlign="start">
            Dashboard Builder
          </Text>
          <Icon ms="auto" as={MdDragIndicator} color="secondaryGray.600" w="24px" h="24px" />
        </Flex>

        {/* Task 3 */}
        <Flex w="100%" justify="space-between" mb="20px">
          <Checkbox defaultChecked me="16px" colorScheme="brandScheme" />
          <Text fontWeight="bold" color={textColor} fontSize="md" textAlign="start">
            Mobile App Design
          </Text>
          <Icon ms="auto" as={MdDragIndicator} color="secondaryGray.600" w="24px" h="24px" />
        </Flex>

        {/* Task 4 */}
        <Flex w="100%" justify="space-between" mb="20px">
          <Checkbox me="16px" colorScheme="brandScheme" />
          <Text fontWeight="bold" color={textColor} fontSize="md" textAlign="start">
            Illustrations
          </Text>
          <Icon ms="auto" as={MdDragIndicator} color="secondaryGray.600" w="24px" h="24px" />
        </Flex>

        {/* Task 5 */}
        <Flex w="100%" justify="space-between" mb="20px">
          <Checkbox defaultChecked me="16px" colorScheme="brandScheme" />
          <Text fontWeight="bold" color={textColor} fontSize="md" textAlign="start">
            Promotional LP
          </Text>
          <Icon ms="auto" as={MdDragIndicator} color="secondaryGray.600" w="24px" h="24px" />
        </Flex>
      </Box>
    </Card>
  );
}
