import {useState, useEffect} from 'react';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;

// ================USAGE================
// import useDebounce from './useDebounce';

// const [searchQuery, setSearchQuery] = useState('');
// const debouncedSearchQuery = useDebounce(searchQuery, 500);

// // Then in a useEffect, react to changes in the debounced value
// useEffect(() => {
//   if (debouncedSearchQuery) {
//     // Perform your search or other action here
//     performSearch(debouncedSearchQuery);
//   }
// }, [debouncedSearchQuery]);
