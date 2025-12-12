const buildFilename = (url) => {
  const withoutProtocol = url.replace(/(^\w+:|^)\/\//, ''); // quita http:// o https://
  const safe = withoutProtocol.replace(/[^a-zA-Z0-9]/g, '-');
  return `${safe}.html`;
};

export default buildFilename;
