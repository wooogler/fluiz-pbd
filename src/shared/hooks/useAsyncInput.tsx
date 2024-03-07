import { useState } from 'react';

export default function useAsyncInput(initialValue, saveFunction, id: string) {
  const [value, setValue] = useState(initialValue);
  const handleChange = event => {
    setValue(event.target.value);
  };

  const handleBlur = async () => {
    await saveFunction(id, value);
  };

  return [value, handleChange, handleBlur];
}
