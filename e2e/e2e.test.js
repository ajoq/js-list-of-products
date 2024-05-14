/* eslint-disable import/no-extraneous-dependencies */
import puppeteer from 'puppeteer-core';
import createPuppeteerTools from 'puppeteer-tools';
import { fork } from 'child_process';
import { createData, updateData, errorCreateData } from './form.data';

jest.setTimeout(30000);

describe('CRUD products', () => {
  let browser = null;
  let page = null;
  let server = null;
  const baseUrl = 'http://localhost:8888';
  let puppeteerTools = null;

  beforeAll(async () => {
    server = fork(`${__dirname}/e2e.server.js`);

    await new Promise((resolve, reject) => {
      server.on('error', reject);
      server.on('message', (message) => {
        if (message === 'ok') {
          resolve();
        }
      });
    });

    browser = await puppeteer.launch({
    //   headless: false,
    //   slowMo: 50,
    //   devtools: false,
    });
    page = await browser.newPage();
    puppeteerTools = createPuppeteerTools(page);
    await page.goto(baseUrl);
  });

  afterAll(async () => {
    await browser.close();
    server.kill();
  });

  test('Add product', async () => {
    await puppeteerTools.utils.click({ tag: 'div', text: '+' });

    await puppeteerTools.form.fill(createData);
    await page.click('button[type=submit]');
    const addedProduct = createData[0].data;
    await puppeteerTools.utils.waitForElement({ tag: 'div', text: addedProduct });
  });

  test('Add product error message', async () => {
    await puppeteerTools.utils.click({ tag: 'div', text: '+' });

    await puppeteerTools.form.fill(errorCreateData);
    await page.click('button[type=submit]');
    await page.waitForSelector('.popover.popover-visible');
    await page.click('button[type=reset]');
  });

  test('Update product', async () => {
    const editButton = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.products-name')).find((item) => item.innerText === 'Товар 1').closest('.products-list__item').querySelector('.edit-btn'));
    await editButton.click();

    await puppeteerTools.form.fill(updateData);
    await page.click('button[type=submit]');
    const updatedProduct = updateData[0].data;
    await puppeteerTools.utils.waitForElement({ tag: 'div', text: updatedProduct });
  });

  test('Delete product', async () => {
    const editButton = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.products-name')).find((item) => item.innerText === 'Товар 2').closest('.products-list__item').querySelector('.delete-btn'));
    await editButton.click();
    await page.click('button.delete-buttons_save');
  });
});
