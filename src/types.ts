export interface APIResponseBase {
	error: string | null;
}

export interface DayRotation {
	[year: string]: {
		[month: string]: {
			[day: string]: number
		}
	};
}
export interface APIDayRotation extends APIResponseBase { days: DayRotation; }

export type School = 'lowerschool' | 'middleschool' | 'upperschool';
export interface SchoolLunch {
	title: string;
	categories: {
		[category: string]: string[]
	};
}
export interface APILunch extends APIResponseBase {
	lunch: {
		[date: string]: Record<School, SchoolLunch>
	};
}
