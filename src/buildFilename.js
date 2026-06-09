const buildName = (url) => {
  const withoutProtocol = url.replace(/(^\w+:|^)\/\//, '');
  return withoutProtocol.replace(/[^a-zA-Z0-9]/g, '-');
};

const buildFilename = (url) => {
  const safe = buildName(url);
  return `${safe}.html`;
};

export { buildName };
export default buildFilename;
