import React, { useState } from 'react';
import '@pages/popup/Popup.css';
import useStorage from '@src/shared/hooks/useStorage';
import withSuspense from '@src/shared/hoc/withSuspense';
import withErrorBoundary from '@src/shared/hoc/withErrorBoundary';
import { Box, Table, Thead, Tr, Tbody, Td, Th, VStack, Text } from '@chakra-ui/react';
import documentInfoStorage from '@root/src/shared/storages/documentInfoStorage';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import elementInfoStorage from '@root/src/shared/storages/elementInfoStorage';

const Popup = () => {
  const documentInfo = useStorage(documentInfoStorage);
  const elementInfo = useStorage(elementInfoStorage);

  const onDrop = acceptedFiles => {
    acceptedFiles.forEach(file => {
      Papa.parse(file, {
        complete: result => {
          console.log(result.data);
          documentInfoStorage.newInfo(result.data);
        },
        header: true,
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
    <VStack spacing={4}>
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
        <Table variant="simple">
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
      <Text>{elementInfo}</Text>
    </VStack>
  );
};

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
