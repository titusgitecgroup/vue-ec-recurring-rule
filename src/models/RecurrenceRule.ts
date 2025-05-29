export interface IRecurrenceRule {
	dtstart: string | undefined;
	until: string | undefined;
	freq: string;
	interval: number;
	count: number;
	bymonth?: number;
	byyearday?: string;
	bymonthday?: number[];
	byweekday?: string[];
	byweekno?: string;
	bysetpos?: number;
}

export class RecurrenceRuleModel implements IRecurrenceRule {
	dtstart: string | undefined = undefined;
	until: string | undefined = undefined;
	freq: string = "";
	interval: number = 1;
	count: number = 0;
	bymonth?: number;
	byyearday?: string;
	bymonthday?: number[] = [];
	byweekday?: string[] = [];
	byweekno?: string = "";
	bysetpos?: number = 0;

	constructor(init?: IRecurrenceRule) {
		if (init) {
			Object.assign(this, init);
		}
	}
}
