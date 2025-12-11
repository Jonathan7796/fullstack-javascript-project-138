import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import nock from 'nock';
import pageLoader from '../src/index.js';

const url = 'https://codica.la/cursos';
const htmlMock = '<html><body>Curso</body></html>';

beforeEach(() => {
  nock.disableNetConnect();
});

test('descarga página correctamente', async () => {
  // Crear directorio temporal aislado
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));

  // Mock HTTP
  nock('https://codica.la')
    .get('/cursos')
    .reply(200, htmlMock);

  // Ejecutar la función principal
  const filepath = await pageLoader(url, tempDir);

  // Leer el archivo guardado
  const data = await fs.readFile(filepath, 'utf-8');

  // Verificar
  expect(data).toBe(htmlMock);

  // Verificar que el archivo tenga formato correcto
  const expectedName = 'codica-la-cursos.html';
  const expectedPath = path.join(tempDir, expectedName);

  expect(filepath).toBe(expectedPath);
});
