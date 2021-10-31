function quantile(arr, q) {
	const sorted = arr.sort((a, b) => a - b);
	const pos = (sorted.length - 1) * q;
	const base = Math.floor(pos);
	const rest = pos - base;

	if (sorted[base + 1] !== undefined) {
		return Math.floor(sorted[base] + rest * (sorted[base + 1] - sorted[base]));
	} else {
		return Math.floor(sorted[base]);
	}
}

function prepareData(result) {
	return result.data.map((item) => {
		item.date = item.timestamp.split('T')[0];

		return item;
	});
}

function calcQuantile(arr) {
	let result = {};

	result.hits = arr.length;
	result.p25 = quantile(arr, 0.25);
	result.p50 = quantile(arr, 0.5);
	result.p75 = quantile(arr, 0.75);
	result.p95 = quantile(arr, 0.95);

	return result;
}

// показать значение метрики за несколько дней
function showMetricByPeriod(data, page, name, date1, date2) {
	const dayMap = {};
	data
		.filter(
			(item) => item.page == page && item.name == name && item.date >= date1 && item.date <= date2,
		)
		.forEach((item) =>
			dayMap[item.date] ? dayMap[item.date].push(item.value) : (dayMap[item.date] = [item.value]),
		);

	let table = {};

	Object.keys(dayMap).forEach((item) => (table[item] = calcQuantile(dayMap[item])));

	console.log(`Metric ${name} for period ${date1}/${date2}:`);

	console.table(table);
}

// показать сессию пользователя
function showSession(data, requestId) {
	console.log(`Session for requestId: ${requestId}`);

	let table = {};

	const filteredData = data
		.filter((item) => item.requestId == requestId)
		.forEach(
			(item, i) =>
				(table[i] = {
					page: item.page,
					name: item.name,
					value: item.value,
					date: item.date,
					platform: item.additional.platform,
				}),
		);

	console.table(table);

	return filteredData;
}

function showMetricByPlatform(data, page, name) {
	const platformMap = {};
	data
		.filter((item) => item.page == page && item.name == name && item.additional.platform)
		.forEach((item) =>
			platformMap[item.additional.platform]
				? platformMap[item.additional.platform].push(item.value)
				: (platformMap[item.additional.platform] = [item.value]),
		);

	let table = {};

	Object.keys(platformMap).forEach((item) => (table[item] = calcQuantile(platformMap[item])));

	console.log(`Metric ${name} by platform`);

	console.table(table);
}

function showMetricByBrowser(data, page, name) {
	const browserMap = {};
	data
		.filter((item) => item.page == page && item.name == name && item.additional.browser)
		.forEach((item) =>
			browserMap[item.additional.browser]
				? browserMap[item.additional.browser].push(item.value)
				: (browserMap[item.additional.browser] = [item.value]),
		);

	let table = {};

	Object.keys(browserMap).forEach((item) => (table[item] = calcQuantile(browserMap[item])));

	console.log(`Metric ${name} by browsers`);

	console.table(table);
}

// Пример
// добавить метрику за выбранный день
function addMetricByDate(data, page, name, date) {
	let sampleData = data
		.filter((item) => item.page == page && item.name == name && item.date == date)
		.map((item) => item.value);

	return calcQuantile(sampleData);
}
// рассчитывает все метрики за день
function calcMetricsByDate(data, page, date) {
	console.log(`All metrics for ${date}:`);

	let table = {};
	table.connect = addMetricByDate(data, page, 'connect', date);
	table.ttfb = addMetricByDate(data, page, 'ttfb', date);
	table.load = addMetricByDate(data, page, 'load', date);
	table.square = addMetricByDate(data, page, 'square', date);
	table.load = addMetricByDate(data, page, 'load', date);
	table.generate = addMetricByDate(data, page, 'generate', date);
	table.draw = addMetricByDate(data, page, 'draw', date);

	console.table(table);
}

fetch('https://shri.yandex/hw/stat/data?counterId=D8F28E50-3339-11EC-9EDF-9F93090795B1')
	.then((res) => res.json())
	.then((result) => {
		let data = prepareData(result);

		calcMetricsByDate(data, 'send test', '2021-10-29');
		showMetricByPeriod(data, 'send test', 'load', '2021-10-22', '2021-10-29');
		showSession(data, '010319662043');
		showMetricByPlatform(data, 'send test', 'load');
		showMetricByBrowser(data, 'send test', 'load');
	});
