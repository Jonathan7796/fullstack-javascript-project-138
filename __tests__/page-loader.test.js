import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import nock from 'nock';

import loadPage from '../src/page-loader.js';
import buildFilename from '../src/buildFilename.js';

const fixtureHTML = '<html><body><h1>Sample page</h1></body></html>';
const pageWithImageHTML = `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Cursos de Programacion de Codica</title>
  </head>
  <body>
    <img src="/assets/professions/nodejs.png" alt="Icono de la profesion de programador Node.js">
    <h3>
      <a href="/professions/nodejs">Programador Node.js</a>
    </h3>
  </body>
</html>`;

let tempDir;

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
});

describe('buildFilename', () => {
  test('builds filename from url', () => {
    const url = 'https://codica.la/cursos';
    const expected = 'codica-la-cursos.html';

    expect(buildFilename(url)).toBe(expected);
  });
});

describe('loadPage', () => {
  test('downloads page and saves it to output directory', async () => {
    const url = 'https://example.com/page';
    const expectedFilePath = path.join(tempDir, 'example-com-page.html');

    nock('https://example.com')
      .get('/page')
      .reply(200, fixtureHTML);

    const filePath = await loadPage(url, tempDir);
    const savedContent = await fs.readFile(filePath, 'utf-8');

    expect(filePath).toBe(expectedFilePath);
    expect(savedContent).toBe(fixtureHTML);
  });

  test('downloads local images and updates html links', async () => {
    const url = 'https://codica.la/cursos';
    const imageContent = Buffer.from('image content');
    const expectedFilePath = path.join(tempDir, 'codica-la-cursos.html');
    const expectedAssetsDirPath = path.join(tempDir, 'codica-la-cursos_files');
    const expectedImagePath = path.join(
      expectedAssetsDirPath,
      'codica-la-assets-professions-nodejs.png',
    );
    const expectedImageLocalPath = 'codica-la-cursos_files/codica-la-assets-professions-nodejs.png';

    nock('https://codica.la')
      .get('/cursos')
      .reply(200, pageWithImageHTML);

    nock('https://codica.la')
      .get('/assets/professions/nodejs.png')
      .reply(200, imageContent, { 'Content-Type': 'image/png' });

    const filePath = await loadPage(url, tempDir);
    const savedHTML = await fs.readFile(filePath, 'utf-8');
    const savedImage = await fs.readFile(expectedImagePath);

    expect(filePath).toBe(expectedFilePath);
    expect(savedImage).toEqual(imageContent);
    expect(savedHTML).toContain(`src="${expectedImageLocalPath}"`);
    expect(savedHTML).toContain('href="/professions/nodejs"');
  });

  test('rejects on http error', async () => {
    const url = 'https://example.com/not-found';

    nock('https://example.com')
      .get('/not-found')
      .reply(404);

    await expect(loadPage(url, tempDir)).rejects.toThrow(
      'Request failed with status code 404',
    );
  });

  test('rejects on network error', async () => {
    const url = 'https://bad.domain/test';

    nock('https://bad.domain')
      .get('/test')
      .replyWithError('connection failed');

    await expect(loadPage(url, tempDir)).rejects.toThrow('connection failed');
  });
});
