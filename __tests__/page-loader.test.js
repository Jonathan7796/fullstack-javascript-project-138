import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import nock from 'nock';

import loadPage from '../src/page-loader.js';
import buildFilename from '../src/buildFilename.js';

const getFixturePath = (filename) =>
  path.join(process.cwd(), '__fixtures__', filename);

let tempDir;

beforeAll(() => {
  // Asegura que Nock no salga a internet
  nock.disableNetConnect();
});

beforeEach(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('buildFilename', () => {
  test('genera correctamente el nombre del archivo', () => {
    const url = 'https://codica.la/cursos';
    const expected = 'codica-la-cursos.html';

    expect(buildFilename(url)).toBe(expected);
  });
});

describe('loadPage', () => {
  test('descarga y guarda una página correctamente', async () => {
    const url = 'https://example.com/page';

    const fixtureHTML = await fs.readFile(getFixturePath('sample.html'), 'utf-8');

    // Mock de la respuesta HTTP
    nock('https://example.com')
      .get('/page')
      .reply(200, fixtureHTML);

    const filePath = await loadPage(url, tempDir);

    const savedContent = await fs.readFile(filePath, 'utf-8');
    expect(savedContent).toBe(fixtureHTML);
  });

  test('maneja correctamente un error 404', async () => {
    const url = 'https://example.com/not-found';

    nock('https://example.com')
      .get('/not-found')
      .reply(404);

    await expect(loadPage(url, tempDir))
      .rejects
      .toThrow('Request failed with status code 404');
  });

  test('maneja error de conexión', async () => {
    const url = 'https://bad.domain/test';

    nock('https://bad.domain')
      .get('/test')
      .replyWithError('connection failed');

    await expect(loadPage(url, tempDir))
      .rejects
      .toThrow('connection failed');
  });
});
