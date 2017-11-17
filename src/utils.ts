import * as request from 'request';
import { APIResponseBase } from './types';

export function postToEndpoint<T extends APIResponseBase>(endpoint: string, data?: object): Promise<T> {
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

export function arrToReadableList(arr: string[]): string {
	const last = arr.pop();
	return `${arr.join(', ')}, and ${last}`;
}
