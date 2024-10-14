// Chakra imports
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';
import Card from 'components/card/Card';
import React from 'react';
import Chart from 'react-apexcharts'; // Ensure apexcharts is installed

// Data for moods (emoji) and the bar values
const moodData = ["😔", "😕", "😐", "😊", "😊", "😁", "😁"];
const weekData = [30, 40, 35, 70, 60, 90, 80]; // Actual mood values
const maxValue = 100; // Max value to represent full bar height

// Chart options styled for curved bars and cleaner axis
const barChartOptions: any = {
  chart: {
    type: 'bar',
    toolbar: { show: false },
    stacked: true, // Enable stacked bars
    animations: { enabled: true },
    background: 'transparent', // Transparent background
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '45%',
      borderRadiusApplication: 'end', // Curve the top end only
      borderRadius: 20, // Smooth rounding on filled bars
      barHeight: '100%',
    },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ["S", "M", "T", "W", "T", "F", "S"], // X-axis labels directly under bars
    axisBorder: { show: false }, // Remove axis line
    axisTicks: { show: false }, // Remove ticks
    labels: {
      style: { colors: '#A3AED0', fontSize: '14px', fontWeight: '500' },
    },
  },
  yaxis: { show: false }, // Hide Y-axis labels
  grid: { show: false }, // No grid lines
  tooltip: { enabled: false }, // Disable tooltips
  fill: { colors: ['#FFFFFF', '#a1adb7'] }, // White for filled, Grey for unfilled
  legend: { show: false }, // Disable legend
};

export default function WeeklyMoodChart(props: { [x: string]: any }) {
  const { ...rest } = props;

  // Chakra UI theme colors
  const textColor = useColorModeValue('secondaryGray.900', 'white');

  // Prepare the series data with two parts: filled and unfilled
  const series = [
    {
      name: 'Filled',
      data: weekData, // Actual mood values
    },
    {
      name: 'Unfilled',
      data: weekData.map(value => maxValue - value), // Remaining space for each bar
    },
  ];

  return (
    <Card alignItems="center" flexDirection="column" w="100%" bg="transparent" boxShadow="none" {...rest}>
      {/* Mood Header */}
      <Flex align="center" w="100%" px="15px" py="10px">
        <Text me="auto" color={textColor} fontSize="xl" fontWeight="700" lineHeight="100%">
          Weekly Mood Tracker
        </Text>
      </Flex>

      {/* Mood Icons above each bar */}
      <Flex justify="space-between" w="100%" px="10px" position="relative" top="10px" zIndex="1">
        {moodData.map((mood, index) => (
          <Box key={index} textAlign="center" w="85px"> {/* Adjust width to match bar spacing */}
            <Text fontSize="2xl" mb="-10px"> {/* Negative margin to overlap */}
              {mood}
            </Text>
          </Box>
        ))}
      </Flex>

      {/* Bar Chart */}
      <Box h="240px" w="100%" mt="-20px" position="relative" zIndex="0">
        <Chart options={barChartOptions} series={series} type="bar" height={240} />
      </Box>

      {/* X-Axis Categories under each bar */}
      <Flex justify="space-between" w="100%" px="10px" mt="5px">

</Flex>

    </Card>
  );
}
