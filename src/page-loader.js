import axios from 'axios';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import path from 'path';
import buildFilename, { buildName } from './buildFilename.js';

const buildResourceFilename = (resourceUrl) => {
  const { hostname, pathname } = new URL(resourceUrl);
  const extension = path.extname(pathname);
  const pathnameWithoutExtension = extension === '' ? pathname : pathname.slice(0, -extension.length);
  const safeName = buildName(`${hostname}${pathnameWithoutExtension}`);

  return `${safeName}${extension}`;
};

const isLocalResource = (pageUrl, resourceUrl) => {
  const page = new URL(pageUrl);
  const resource = new URL(resourceUrl, pageUrl);
  return page.hostname === resource.hostname;
};

const getImages = ($, pageUrl, assetsDirName) => $('img')
  .toArray()
  .map((element) => {
    const src = $(element).attr('src');

    if (!src) {
      return null;
    }

    const resourceUrl = new URL(src, pageUrl).toString();

    if (!isLocalResource(pageUrl, resourceUrl)) {
      return null;
    }

    const filename = buildResourceFilename(resourceUrl);
    const localPath = path.posix.join(assetsDirName, filename);
    $(element).attr('src', localPath);

    return { resourceUrl, filename };
  })
  .filter((image) => image !== null);

const loadPage = (url, outputDir = process.cwd()) => {
  const fileName = buildFilename(url);
  const fullPath = path.resolve(outputDir, fileName);
  const assetsDirName = `${path.parse(fileName).name}_files`;
  const assetsDirPath = path.resolve(outputDir, assetsDirName);

  return axios
    .get(url)
    .then((response) => {
      const $ = cheerio.load(response.data);
      const images = getImages($, url, assetsDirName);

      if (images.length === 0) {
        return fs.writeFile(fullPath, response.data, 'utf-8');
      }

      const html = $.html();

      return fs.mkdir(assetsDirPath, { recursive: true })
        .then(() => Promise.all(images.map(({ resourceUrl, filename }) => {
          const resourcePath = path.join(assetsDirPath, filename);
          return axios
            .get(resourceUrl, { responseType: 'arraybuffer' })
            .then(({ data }) => fs.writeFile(resourcePath, data));
        })))
        .then(() => fs.writeFile(fullPath, html, 'utf-8'));
    })
    .then(() => fullPath);
};

export default loadPage;
