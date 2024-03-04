export const extractQueryParams = (queryString: string) => {
  // Remove the leading '?' if present
  if (queryString.startsWith('/?')) {
    queryString = queryString.slice(2);
  }

  // Split the string into individual key-value pairs
  const queryParams = queryString.split('&');

  // Initialize an object to store the extracted parameters
  const extractedParams = {};

  // Iterate through each key-value pair and extract the parameter
  queryParams.forEach((param) => {
    const [key, value] = param.split('=');
    extractedParams[key] = decodeURIComponent(value);
  });

  return extractedParams;
};
