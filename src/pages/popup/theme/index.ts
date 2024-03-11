import { extendTheme } from '@chakra-ui/react';
import { tableTheme } from './table';
import { inputTheme } from './input';

const theme = extendTheme({
  components: { Table: tableTheme, Input: inputTheme },
});

export default theme;
