import React, { useEffect } from 'react';
import '@pages/popup/Popup.css';
import useStorage from '@src/shared/hooks/useStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import {
  Box,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Th,
  Text,
  Flex,
  Button,
  Spacer,
  VStack,
  StackDivider,
} from '@chakra-ui/react';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import eventInfoStorage from '@root/src/shared/storages/eventInfoStorage';
import { DeleteIcon } from '@chakra-ui/icons';

const Popup = () => {
  const documentInfo = useStorage(documentInfoStorage);
  const eventInfo = useStorage(eventInfoStorage);

  useEffect(() => {
    console.log(documentInfo);
  }, [documentInfo]);

  const onDrop = acceptedFiles => {
    acceptedFiles.forEach(file => {
      Papa.parse(file, {
        complete: result => {
          console.log(result.data);
          documentInfoStorage.newInfo(result.data);
        },
        header: true,
        skipEmptyLines: true,
      });
    });
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      'text/csv': ['.csv'],
    },
  });

  return (
    <VStack w="100%" divider={<StackDivider borderColor="gray.200" />} spacing={4} p={4}>
      <VStack w="100%">
        <Box
          {...getRootProps()}
          p={5}
          border="2px"
          borderColor={isDragActive ? 'green.300' : 'gray.200'}
          bg={isDragActive ? 'green.50' : 'gray.50'}
          borderRadius="md"
          textAlign="center"
          cursor="pointer"
          onClick={open}>
          <input {...getInputProps()} />
          <Text>여기에 파일을 가져다놓거나 클릭하여 파일을 선택하세요.</Text>
        </Box>
        {documentInfo.length > 0 && (
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                {Object.keys(documentInfo[0]).map(header => (
                  <Th key={header}>{header}</Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {documentInfo.map((row, index) => (
                <Tr key={index}>
                  {Object.keys(row).map(cell => (
                    <Td key={cell}>{row[cell]}</Td>
                  ))}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </VStack>
      <VStack w="100%">
        <Flex w="100%" align="center">
          <Text fontSize="xl" fontWeight="bold" mr={2}>
            Event List
          </Text>
          <Text>{`(${eventInfo.length} Events)`}</Text>
          <Spacer />
          <Button size="sm" colorScheme="blue" onClick={() => eventInfoStorage.clearEvents()}>
            Clear
          </Button>
        </Flex>
        <Box overflowY="auto" maxH={250} w="100%">
          <Table variant="simple" size="sm" w="100%">
            <Thead position="sticky" top={0} bgColor="white">
              <Tr>
                <Th>Event</Th>
                <Th>Target ID</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {eventInfo.map(item => (
                <Tr key={item.targetId}>
                  <Td>{item.type}</Td>
                  <Td>{item.targetId.slice(0, 20)}</Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => eventInfoStorage.deleteEvent(item.targetId)}>
                      <DeleteIcon />
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </VStack>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
