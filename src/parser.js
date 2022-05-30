export default (content) => {
  const parser = new DOMParser();
  const streamContent = parser.parseFromString(content, 'application/xml');
  const parserError = streamContent.querySelector('parsererror');
  if (parserError !== null) {
    throw new Error('errors.parser');
  }
  return streamContent.documentElement;
};
