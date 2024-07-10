const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs'); // Import the file system module

puppeteer.use(StealthPlugin());

// Utility function to wait for a specific time in milliseconds
const waitForTimeout = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        protocolTimeout: 200000 // Increased to 200 seconds
    });
    const page = await browser.newPage();

    // Number of pages to scrape
    const totalPages = 15;
    let allData = []; // Array to store all scraped data

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const start = pageIndex * 20;
        const url = `https://www.google.com/search?q=rto+consultant+kolkata&client=firefox-b-d&sca_esv=68bfdf527d5dcfbf&biw=1536&bih=730&tbm=lcl&sxsrf=ADLYWIL_SdUTUEXEqN1mI_LAoTt3JSABDw%3A1719375395723&ei=I5Z7ZvfiK8-D2roPjpWC4Ac&ved=0ahUKEwi3gMq9tPiGAxXPgVYBHY6KAHwQ4dUDCAk&uact=5&oq=rto+consultant+kolkata&gs_lp=Eg1nd3Mtd2l6LWxvY2FsIhZydG8gY29uc3VsdGFudCBrb2xrYXRhMgUQABiABDILEAAYgAQYhgMYigUyCxAAGIAEGIYDGIoFMgsQABiABBiGAxiKBTIIEAAYgAQYogRI1QdQjQVYjQVwAHgAkAEAmAGNAaABjAKqAQMwLjK4AQPIAQD4AQGYAgKgApcCwgIGEAAYBxgemAMAiAYBkgcDMC4yoAfeBg&sclient=gws-wiz-local#rlfi=hd:;si:;mv:[[22.588158,88.3877243],[22.4965481,88.3407788]];tbs:lrf:!1m4!1u3!2m2!3m1!1e1!1m4!1u2!2m2!2m1!1e1!2m1!1e2!2m1!1e3!3sIAE,lf:1,lf_ui:2;start:${start}`;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for 7 seconds to allow manual clicks or any other activity
            console.log('Waiting for 5 seconds...');
            await waitForTimeout(1000); // Wait for 5 seconds

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
})();