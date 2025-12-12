import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import buildFilename from './buildFilename.js';

const loadPage = (url, outputDir = process.cwd()) => {
  const fileName = buildFilename(url);
  const fullPath = path.join(outputDir, fileName);

  return axios
    .get(url)
    .then((response) =>
      fs.writeFile(fullPath, response.data, 'utf-8')
    )
    .then(() => fullPath); // devuelve la ruta completa
};

export default loadPage;
