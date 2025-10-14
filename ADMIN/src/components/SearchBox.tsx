// import React, { useState, useEffect } from 'react';
// import { Input } from 'antd';
// import { SearchOutlined } from '@ant-design/icons';


// interface SearchBoxProps {
//   onSearch?: (query: string) => void;
//   placeholder?: string;
//   className?: string;
// }

// const SearchBox: React.FC<SearchBoxProps> = ({ 
//   onSearch, 
//   placeholder = "Tìm kiếm sản phẩm, đơn hàng, khách hàng...",
//   className 
// }) => {
//   const [query, setQuery] = useState('');
//   const [debouncedQuery, setDebouncedQuery] = useState('');

//   // Debounce search query
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedQuery(query);
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [query]);

//   // Perform search when debounced query changes
//   useEffect(() => {
//     if (debouncedQuery.trim().length >= 2) {
//       if (onSearch) {
//         onSearch(debouncedQuery.trim());
//       }
//     } else if (debouncedQuery.trim().length === 0 && onSearch) {
//       // Clear search results when query is empty
//       onSearch('');
//     }
//   }, [debouncedQuery, onSearch]);

//   const handleKeyPress = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       if (query.trim().length >= 2 && onSearch) {
//         onSearch(query.trim());
//       } else if (query.trim().length === 0 && onSearch) {
//         onSearch('');
//       }
//     }
//   };



//   return (
//     <div className={className}>
//       <Input
//         placeholder={placeholder}
//         prefix={<SearchOutlined />}
//         value={query}
//         onChange={(e) => setQuery(e.target.value)}
//         onKeyPress={handleKeyPress}
//         style={{
//           borderRadius: '8px',
//           border: '1px solid #d9d9d9',
//           boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
//         }}
//         size="large"
//       />
//     </div>
//   );
// };

// export default SearchBox;
