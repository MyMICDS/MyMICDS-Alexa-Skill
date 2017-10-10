import * as Alexa from 'alexa-sdk';
import * as moment from 'moment';
import { postToEndpoint } from './utils';

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
		const date = moment(slots.date.value);
		const school = slots.school.value || 'Upper School';
		const lunch = (await postToEndpoint('/lunch/get', {
			year: date.year(),
			month: date.month() + 1,
			day: date.date()
		})).lunch;

		if (Object.keys(lunch).length === 0) {
			this.emit(':tell', 'Sorry, I couldn\'t find the lunch for that date.');
		} else {
			const schoolLunch = lunch[date.format('YYYY-MM-DD')][school.toLowerCase().replace(/ /g, '')];
			this.emit(':tell', (schoolLunch.categories['Main Entree'] || schoolLunch.categories['Main Dish']).join(', '));
		}
	},
	'Unhandled'() {
		this.emit(':tell', 'Sorry, I don\'t understand.');
	},

	// special Amazon intents
	'AMAZON.HelpIntent'() {
		this.emit(
			':ask',
			'I can get the lunch and day rotation. Try asking me "Alexa, ask MyMICDS what\'s for lunch today."',
			'What can I help you with?'
		);
	},
	// I don't personally like the goodbye message, so we're just not going to have one
	'AMAZON.StopIntent'() {
		this.emit(':responseReady');
	},
	'AMAZON.CancelIntent'() {
		this.emit(':responseReady');
	}
};
