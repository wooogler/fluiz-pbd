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
  VStack,
  StackDivider,
  HStack,
  Divider,
} from '@chakra-ui/react';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import Console from './components/Console';
import EventList from './components/EventList';
import TaskList from './components/TaskList';

const Popup = () => {
  const documentInfo = useStorage(documentInfoStorage);

  const onDrop = acceptedFiles => {
    acceptedFiles.forEach(file => {
      Papa.parse(file, {
        complete: result => {
          const dict = {};
          result.data.forEach(item => {
            const [key, value] = item;
            dict[key] = value;
          });
          console.log(dict);
          documentInfoStorage.newInfo(dict);
        },
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
    <Flex h="full" flex={1} w="100%">
      <VStack w="100%" spacing={3} p={3}>
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
          {Object.keys(documentInfo).length > 0 && (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Key</Th>
                  <Th>Value</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(documentInfo).map(([key, value], index) => (
                  <Tr key={index}>
                    <Td>{key}</Td>
                    <Td>{value}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </VStack>
        <Flex h="full" flex={1} w="100%" overflowY="hidden">
          <TaskList />
          <Divider orientation="vertical" />
          <EventList />
        </Flex>
      </VStack>
      {/* <Console /> */}
    </Flex>
  );
};

export default withErrorBoundary(
  withSuspense(Popup, <div> Loading ... </div>),
  <div> Error Occur </div>,
);
