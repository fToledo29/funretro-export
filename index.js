const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
let [url, format] = process.argv.slice(2);

if (!url) {
	throw 'Please provide a URL as the first argument.';
}

let boardTitle = '';

const getInnerText = (node) => node.innerText.trim();

/**
 * Gets the headers as an array from the given object.
 * @param {Object} table Data that represents the body of the CSV File
 * @returns Array
 */
const getHeaders = (table = {}) => {
	let headers = [];
	for (const column in table) {
		if (Object.hasOwnProperty.call(table, column)) {
			headers.push(column)
		}
	}
	return headers;
}

/**
 * Organizes the data on csvStructure based on the given headers.
 * @param {Object} table The whole body of the CSV file.
 * @param {Array} headers Title of the colums.
 * @param {Array} csvStructure Organized content of the CSV Table
 * @returns Array.
 */
const concatData = (table = {}, headers = [], csvStructure = []) => {

	for (let i = 0; i < headers.length; i++) {
		let rows = Array.from({length: headers.length}, () => "");
		let f = 0;
		for (const column in table) {
			rows[f] = table[column].rows[i];
			f++;
		}
		csvStructure.push(rows);
	}

	return csvStructure
}

/**
 * Organizes the structure of the data separating the headers and the content 
 * then concatenates it on a single array and finally maps all the content as
 * a properly formatted string.
 * @param {Object} table Data that represents the body of the CSV File
 * @returns string
 */
const getCSVValues = (table) => {
	let csvStructure = [];
	let headers = getHeaders(table);
	csvStructure.push(headers);
	csvStructure = concatData(table, headers, csvStructure)
	return csvStructure.map(val => val.join(',')).join('\n');
}

/**
 * Renders the Website 
 */
const loadContent = async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(url);
	await page.waitForSelector('.easy-board');
	await page.waitForSelector('.board-name');

	boardTitle = await page.$eval('.board-name', getInnerText);

	if (!boardTitle) {
		throw 'Board title does not exist. Please check if provided URL is correct.';
	}

	return page.$$('.easy-card-list');
}

/**
 * Retrieves the messages from the html lists.
 * @param {ElementHandle} element Object
 * @returns ElementHandle[]
 */
const getMessages = async (element) => {
	return await element.$$('.column > li');
}

/**
 * Gets the titles of the columns.
 * @param {ElementHandle} element Object of elements
 * @returns string
 */
const getColumnTitle = async (element) => {
	return await element.$eval(
		'.column-header > h2',
		getInnerText,
	);
}

/**
 * Gets the comments as plain text.
 * @param {ElementHandle} element Object of elements
 * @returns string
 */
const getMessageText = async (element) => {
	return element.$eval(
		'.easy-card-body .text',
		getInnerText,
	);
}

/**
 * Gets the number of votes from the comments on the given element
 * @param {ElementHandle} element Object of elements
 * @returns string
 */
const getVotesCount = async (element) => {
	return element.$eval(
		'.easy-card-votes-container span.easy-badge-votes',
		getInnerText
	);
}

/**
 * Prepares data to be exported as TXT File.
 * @returns string
 */
async function getTxt() {

	const columns = await loadContent();
	let parsedText = boardTitle + '\n\n';

	for (let i = 0; i < columns.length; i++) {

		const columnTitle = await getColumnTitle(columns[i]);
		const messages = await getMessages(columns[i]);
		if (messages.length) {
			parsedText += columnTitle + '\n';
		}

		for (let i = 0; i < messages.length; i++) {
			const messageText = await getMessageText(messages[i]);
			const votes = await getVotesCount(messages[i]);
			parsedText += `- ${messageText} (${votes})` + '\n';
		}

		if (messages.length) {
			parsedText += '\n';
		}
	}

	return parsedText;
}

/**
 * Prepares data to be exported as CSV file
 * @returns strng
 */
async function getCSV() {
	
	let table = {};
	const columns = await loadContent();

	for (let i = 0; i < columns.length; i++) {

		const messages = await getMessages(columns[i]);
		const columnTitle = await getColumnTitle(columns[i]);
		table[columnTitle] = { rows: []};

		for (let i = 0; i < messages.length; i++) {

			const votesCount = await getVotesCount(messages[i]);
			const messageText = await getMessageText(messages[i]);

			if (votesCount < 1) {
				continue;
			}
		
			table[columnTitle].rows.push(messageText)
		}

	}

	return getCSVValues(table);
}

/**
 * Starts the app.
 * @returns Promise<string>
 */
async function run() { 
	if (format && format.toLowerCase() === 'csv') {
		return getCSV();
	} else {
		return getTxt();
	}
}

function writeToFile(data) {
	const datetime = new Date();
	const extension = format ? format.toLowerCase() : 'txt';
	const fileName = `../${boardTitle.replace(/\W/g, '')}-${datetime.toISOString().slice(0, 10)}.${extension}`
	const resolvedPath = path.resolve(fileName);
	fs.writeFile(resolvedPath, data, (error) => {
		if (error) {
			throw error;
		} else {
			console.info(`Successfully written to file at: ${resolvedPath}`);
		}
		process.exit();
	});
}

function handleError(error) {
	console.error(error);
}

run()
.then((data) => writeToFile(data))
.catch(handleError);
