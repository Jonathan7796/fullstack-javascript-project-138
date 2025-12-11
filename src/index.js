import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const buildFileName = (url) => {
  const withoutProtocol = url.replace(/^https?:\/\//, '');
  const normalized = withoutProtocol.replace(/[^a-zA-Z0-9]/g, '-');
  return `${normalized}.html`;
};

export default function pageLoader(url, outputPath) {
  const fileName = buildFileName(url);
  const filePath = path.join(outputPath, fileName);

  // NO se permite async/await → solo promesas
  return axios.get(url)
    .then((response) =>
      fs.writeFile(filePath, response.data)
    )
    .then(() => filePath);
}
