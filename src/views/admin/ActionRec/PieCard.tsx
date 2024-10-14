// Chakra imports
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
// Custom components
import Card from 'components/card/Card'; 
import { PieChart, Pie, Cell, Tooltip } from 'recharts'; // Import Recharts components

// Data for the chart (JSON structure)
const chartData = [
  { label: 'Professional Network', value: 40, color: '#5C5C5C' },
  { label: 'Mentor', value: 20, color: '#A67A44' },
  { label: 'Family', value: 20, color: '#4B4B39' },
  { label: 'Friends', value: 10, color: '#F7DF79' },
  { label: 'Partner', value: 10, color: '#B3B3A6' },
];

export default function Conversion(props: any) {
  const { ...rest } = props;

  return (
    <Card alignItems="center" flexDirection="column" w="100%" bg="transparent" boxShadow="none" {...rest}>
      <Text
        fontSize="lg"
        fontWeight="bold"
        mb="4"
        color={useColorModeValue('gray.700', 'gray.200')}
      >
        It seems you are most joyful when you’re with family, partner, and friends.
      </Text>
      <Box w="200px" h="200px">
        <PieChart width={300} height={300}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={5}
            fill="#8884d8"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </Box>
    </Card>
  );
}
