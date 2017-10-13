import * as Alexa from 'alexa-sdk';
import * as moment from 'moment';
import * as sanitizeHTML from 'sanitize-html';
import { arrToReadableList, postToEndpoint } from './utils';

// tslint:disable-next-line no-unused-variable
export function handler(event: Alexa.RequestBody<Alexa.Request>, context: Alexa.Context, callback: () => void) {
	const alexa = Alexa.handler(event, context);
	alexa.resources = {};
	alexa.registerHandlers(handlers);
	alexa.execute();
}

const handlers: Alexa.Handlers<Alexa.Request> = {
	// usually I wouldn't quote these, but the Amazon intents have periods, and we gotta stay consistent
	'LaunchRequest'() {
		this.emit('AMAZON.HelpIntent');
	},
	async 'MyMICDSGetLunchIntent'() {
		// `intent` cannot be undefined here since we will not be sending a request without the intent
		// however, it would be undefined if we were to send a LaunchRequest

		const slots  = (this.event.request as Alexa.IntentRequest).intent!.slots;
		const date   = moment(slots.date.value);
		const school = slots.school.value || 'Upper School';
		const lunch  = (await postToEndpoint('/lunch/get', {
			year: date.year(),
			month: date.month() + 1,
			day: date.date()
		})).lunch;

		const dateLunch = lunch[date.format('YYYY-MM-DD')];

		if (Object.keys(lunch).length === 0 || typeof dateLunch === 'undefined') {
			this.emit(':tell', 'Sorry, I couldn\'t find the lunch for that date.');
		} else {
			const schoolLunch = dateLunch[school.toLowerCase().replace(/ /g, '')];
			const lunchList   = arrToReadableList(schoolLunch.categories['Main Entree'] || schoolLunch.categories['Main Dish']);
			this.emit(':tell', `The lunch for <say-as interpret-as="date">${date.format('YYYYMMDD')}</say-as> is ${sanitizeHTML(lunchList)}.`);
		}
	},
	async 'MyMICDSGetDayIntent'() {
		const days = (await postToEndpoint('/portal/day-rotation')).days;

		if (Object.keys(days).length === 0) {
			this.emit(':tell', 'Sorry, I\'m not able to get the day rotation right now.');
		} else {
			const date  = moment((this.event.request as Alexa.IntentRequest).intent!.slots.date.value);
			// undefined handling
			const year  = days[date.year().toString()] || {};
			const month = year[(date.month() + 1).toString()] || {};
			const day   = month[date.date().toString()];

			if (typeof day === 'undefined') {
				this.emit(':tell', 'Sorry, I couldn\'t find the day for that date.');
			} else {
				this.emit(':tell', `<say-as interpret-as="date">${date.format('YYYYMMDD')}</say-as> is a Day ${day}.`);
			}
		}
	},
	'Unhandled'() {
		this.emit(':tell', 'Sorry, I don\'t understand.');
	},

	// special Amazon intents
	'AMAZON.HelpIntent'() {
		this.emit(
			':ask',
			'I can get the lunch and day rotation. Try asking me what\'s for lunch today.',
			'What can I help you with?'
		);
	},
	'AMAZON.StopIntent'() {
		this.emit(':tell', 'Goodbye!');
	},
	'AMAZON.CancelIntent'() {
		this.emit(':tell', 'Goodbye!');
	}
};
