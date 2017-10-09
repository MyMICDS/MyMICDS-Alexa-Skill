import * as request from 'request';

export function postToEndpoint(endpoint: string, data?: object): Promise<any> {
	return new Promise((resolve, reject) => {
		request({
			url: 'https://api.mymicds.net' + endpoint,
			method: 'POST',
			json: true // auto-parses JSON response
		}, (err, res, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(body);
		});
	});
}
