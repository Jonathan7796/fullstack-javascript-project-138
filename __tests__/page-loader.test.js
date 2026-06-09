import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import nock from 'nock';

import loadPage from '../src/page-loader.js';
import buildFilename from '../src/buildFilename.js';

const fixtureHTML = '<html><body><h1>Sample page</h1></body></html>';

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
