const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const bodyParser = require('body-parser');
const fs = require('fs'); // Import the file system module

puppeteer.use(StealthPlugin());

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Utility function to wait for a specific time in milliseconds
const waitForTimeout = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const totalPages = 15; // Fixed number of pages to scrape

    try {
        const browser = await puppeteer.launch({
            headless: true, // Run in headless mode
            defaultViewport: null,
            protocolTimeout: 200000 // Increased to 200 seconds
        });
        const page = await browser.newPage();
        let allData = []; // Array to store all scraped data

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const start = pageIndex * 20;
            const paginatedUrl = `${url}&start=${start}`;

            try {
                await page.goto(paginatedUrl, { waitUntil: 'networkidle2', timeout: 60000 });

                // Wait for 1 second to allow any dynamic content to load
                console.log('Waiting for 1 second...');
                await waitForTimeout(300); // Wait for 1 second

                console.log(`Scraping data from page ${pageIndex + 1}...`);

                const results = await page.evaluate(() => {
                    const data = [];

                    // Regular expression to remove experience section
                    const experienceRegex = /\d+\+ years in business · /;

                    // Select all result containers
                    const resultContainers = document.querySelectorAll('div.uMdZh.tIxNaf');

                    // Iterate over each result container to extract data
                    resultContainers.forEach(container => {
                        const nameElement = container.querySelector('div > div > a > div > div > div.dbg0pd > span');
                        const addressElement = container.querySelector('div > div > a > div > div > div:nth-child(3)');
                        const numberElement = container.querySelector('div > div > a > div > div > div:nth-child(4)');
                        const websiteElement = container.querySelector('div > a.yYlJEf.Q7PwXb.L48Cpd.brKmxb');

                        const name = nameElement ? nameElement.textContent.trim() : 'N/A';
                        let address = addressElement ? addressElement.textContent.trim() : 'N/A';
                        const numberMatch = numberElement ? numberElement.textContent.trim().match(/(\d{3,}[-\s.]?)*\d{3,}/) : null;
                        const number = numberMatch ? numberMatch[0].replace(/[-\s.]/g, '') : 'N/A';
                        const website = websiteElement ? websiteElement.href : 'N/A';

                        // Remove the experience section from the address
                        address = address.replace(experienceRegex, '');

                        data.push({ name, address, number, website });
                    });

                    return data;
                });

                // Log the count of scraped data for the current page
                console.log(`Number of entries fetched from page ${pageIndex + 1}: ${results.length}`);

                // Append the scraped data to the allData array
                allData = allData.concat(results);

                // Break the loop if no data was scraped
                if (results.length === 0) {
                    console.log(`No data found on page ${pageIndex + 1}. Terminating the loop.`);
                    break;
                }

            } catch (error) {
                console.error(`Error occurred on page ${pageIndex + 1}:`, error);
            }
        }

        // Log the total count of scraped data
        console.log(`Total number of entries fetched: ${allData.length}`);

        // Log all the scraped data
        console.log('Scraped Data:', JSON.stringify(allData, null, 2));

        // Save all the scraped data to a JSON file
        fs.writeFileSync('scrapedData.json', JSON.stringify(allData, null, 2), 'utf-8');
        console.log('Data has been saved to scrapedData.json');

        await browser.close();

        // Return the scraped data as a response
        res.json(allData);

    } catch (error) {
        console.error('Error occurred during scraping:', error);
        res.status(500).json({ error: 'An error occurred during scraping' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
