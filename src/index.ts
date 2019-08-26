import { MyMICDS, School } from '@mymicds/sdk';
import { ErrorHandler, RequestHandler, SkillBuilders } from 'ask-sdk-core';
import { IntentRequest } from 'ask-sdk-model';
import { arrToReadableList } from './utils';

// tslint:disable:no-empty
const mymicds = new MyMICDS({
	baseURL: 'https://api.mymicds.net/v3',
	jwtGetter: () => null,
	jwtSetter: () => {},
	jwtClear: () => {}
});

const helpAndLaunchHandler: RequestHandler = {
	canHandle(input) {
		return (
			input.requestEnvelope.request.type === 'LaunchRequest' ||
			(input.requestEnvelope.request.type === 'IntentRequest' &&
				input.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent')
		);
	},
	handle(input) {
		return input.responseBuilder
			.speak("I can get the lunch and day rotation. Try asking me what's for lunch today.")
			.reprompt('What can I help you with?')
			.getResponse();
	}
};

const lunchHandler: RequestHandler = {
	canHandle(input) {
		return (
			input.requestEnvelope.request.type === 'IntentRequest' &&
			input.requestEnvelope.request.intent.name === 'MyMICDSGetLunchIntent'
		);
	},
	async handle(input) {
		const slots = (input.requestEnvelope.request as IntentRequest).intent.slots!;
		const dateString = slots.date.value!;
		const school = slots.school.value || 'Upper School';

		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			throw new Error('Sorry, that date is invalid.');
		}

		const { lunch } = await mymicds.lunch
			.get(
				{
					year: date.getUTCFullYear(),
					month: date.getUTCMonth() + 1,
					day: date.getUTCDate()
				},
				true
			)
			.toPromise();

		const dateLunch = lunch[dateString];

		if (typeof dateLunch === 'undefined') {
			throw new Error("Sorry, I couldn't find the lunch for that date.");
		}

		const schoolLunch = dateLunch[school.toLowerCase().replace(/ /g, '') as School].categories;
		const categories = Object.keys(schoolLunch);
		const entreeCategory = categories.find(c => c.includes('Entree'));

		if (categories.length === 0 || typeof entreeCategory === 'undefined') {
			return input.responseBuilder
				.speak("There's no lunch yet for that date.")
				.withShouldEndSession(true)
				.getResponse();
		}

		const lunchList = arrToReadableList(schoolLunch[entreeCategory]);
		return input.responseBuilder
			.speak(`The lunch for <say-as interpret-as="date">${dateString}</say-as> is ${lunchList}.`)
			.withShouldEndSession(true)
			.getResponse();
	}
};

const dayRotationHandler: RequestHandler = {
	canHandle(input) {
		return (
			input.requestEnvelope.request.type === 'IntentRequest' &&
			input.requestEnvelope.request.intent.name === 'MyMICDSGetDayIntent'
		);
	},
	async handle(input) {
		const { days } = await mymicds.portal.getDayRotation(true).toPromise();

		if (Object.keys(days).length === 0) {
			throw new Error("Sorry, I'm not able to get the day rotation right now.");
		}

		const slots = (input.requestEnvelope.request as IntentRequest).intent.slots!;
		const dateString = slots.date.value!;
		const date = new Date(dateString);

		const year = days[date.getUTCFullYear().toString()] || {};
		const month = year[(date.getUTCMonth() + 1).toString()] || {};
		const day = month[date.getUTCDate().toString()];

		if (typeof day === 'undefined') {
			throw new Error("Sorry, I couldn't find the day for that date.");
		}

		return input.responseBuilder
			.speak(`<say-as interpret-as="date">${dateString}</say-as> is a Day ${day}.`)
			.withShouldEndSession(true)
			.getResponse();
	}
};

const cancelAndStopHandler: RequestHandler = {
	canHandle(input) {
		return (
			input.requestEnvelope.request.type === 'IntentRequest' &&
			(input.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent' ||
				input.requestEnvelope.request.intent.name === 'AMAZON.StopIntent')
		);
	},
	handle(input) {
		return input.responseBuilder.speak('Goodbye!').getResponse();
	}
};

const fallbackHandler: RequestHandler = {
	canHandle(input) {
		return (
			input.requestEnvelope.request.type === 'IntentRequest' &&
			input.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent'
		);
	},
	handle(input) {
		return input.responseBuilder.speak("Sorry, I don't understand.").getResponse();
	}
};

const sessionEndedHandler: RequestHandler = {
	canHandle(input) {
		return input.requestEnvelope.request.type === 'SessionEndedRequest';
	},
	handle(input) {
		return input.responseBuilder.getResponse();
	}
};

const errorHandler: ErrorHandler = {
	canHandle() {
		return true;
	},
	handle(input, error) {
		return input.responseBuilder.speak(error.message).getResponse();
	}
};

// noinspection JSUnusedGlobalSymbols
export const handler = SkillBuilders.custom()
	.addRequestHandlers(
		helpAndLaunchHandler,
		lunchHandler,
		dayRotationHandler,
		sessionEndedHandler,
		fallbackHandler,
		cancelAndStopHandler
	)
	.addErrorHandlers(errorHandler)
	.lambda();
