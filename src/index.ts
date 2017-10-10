import * as Alexa from 'alexa-sdk';
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
		this.emit('MyMICDSGetLunchIntent');
	},
	'MyMICDSGetLunchIntent'() {
		const intent = (this.event.request as Alexa.IntentRequest).intent;
		this.emit(':tell', intent ? JSON.stringify(intent.slots) : 'test');
	},
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
	},
	'Unhandled'() {
		this.emit(':tell', 'Sorry, I don\'t understand.');
	}
};
