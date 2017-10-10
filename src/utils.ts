import * as request from 'request';

export function postToEndpoint(endpoint: string, data?: object): Promise<any> {
	return new Promise((resolve, reject) => {
		request.post({
			url: 'https://api.mymicds.net' + endpoint,
			json: true, // auto-parses JSON response and auto-serializes JSON body
			body: data
		}, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(body);
		});
	});
}
