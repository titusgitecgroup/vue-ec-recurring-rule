<script lang="ts">
	import { Component, Prop, Vue, Watch } from "vue-property-decorator";
	import { RRule, Weekday, Frequency } from "rrule";
	import { format, parse } from "date-fns";
	import { ValidationProvider, ValidationObserver } from "vee-validate";
	import DatePicker from "vue2-datepicker";
	import "vue2-datepicker/index.css";
	import { RecurrenceRuleModel, IRecurrenceRule } from "../models/RecurrenceRule";
	import { TextConverter } from "../helpers/TextConverter";

	@Component({
		name: "EcRecurringRule",
		components: {
			ValidationProvider,
			ValidationObserver,
			DatePicker,
		},
	})
	export default class EcRecurringRule extends Vue {
		@Prop({ required: true, type: Array })
		frequencies!: { value: string; label: string }[];

		@Prop({ type: String })
		rrule?: string;

		public recurrence: RecurrenceRuleModel = new RecurrenceRuleModel();
		public rule: RRule | null = null;
		public ruleText: string | null = null;
		public showModal: boolean = false;
		public endsOption: string = "never";
		public repeatOption: string = "days";
		public filteredFrequencies: { value: string; label: string }[] = [];

		private wkst = [
			{ value: "SU", label: "S" },
			{ value: "MO", label: "M" },
			{ value: "TU", label: "T" },
			{ value: "WE", label: "W" },
			{ value: "TH", label: "T" },
			{ value: "FR", label: "F" },
			{ value: "SA", label: "S" },
		];

		private months = [
			{ value: 1, label: "January" },
			{ value: 2, label: "February" },
			{ value: 3, label: "March" },
			{ value: 4, label: "April" },
			{ value: 5, label: "May" },
			{ value: 6, label: "June" },
			{ value: 7, label: "July" },
			{ value: 8, label: "August" },
			{ value: 9, label: "September" },
			{ value: 10, label: "October" },
			{ value: 11, label: "November" },
			{ value: 12, label: "December" },
		];

		private ordinalWords = [
			{ value: 1, label: "1st " },
			{ value: 2, label: "2nd " },
			{ value: 3, label: "3rd " },
			{ value: 4, label: "4th " },
			{ value: 5, label: "5th " },
		];

		// Computed properties for DatePicker v-model
		get dtstartModel(): string | undefined {
			return this.recurrence.dtstart ?? undefined;
		}
		set dtstartModel(value: string | undefined) {
			this.recurrence.dtstart = value;
		}

		get untilModel(): string | undefined {
			return this.recurrence.until ?? undefined;
		}
		set untilModel(value: string | undefined) {
			this.recurrence.until = value;
		}

		public showRecurringModal() {
			this.showModal = true;
		}

		public cancel() {
			this.showModal = false;
			this.recurrence = new RecurrenceRuleModel();
			this.rule = null;
			this.ruleText = null;
		}

		public close() {
			this.showModal = false;
		}

		updateFields() {
			const freqValue = this.recurrence.freq;
			const startDate = this.recurrence.dtstart;
			this.recurrence = new RecurrenceRuleModel();
			this.recurrence.freq = freqValue;
			this.recurrence.dtstart = startDate;
			this.recurrence.byweekno = "1";
			if (this.recurrence.freq !== "WEEKLY") {
				this.repeatOption = "days";
			}
			this.endsOption = "never";
		}

		get getFrequencyLabel() {
			return this.frequencies.find((f) => f.value === this.recurrence.freq)?.label;
		}

		get getDateFormat() {
			return "MM/dd/yyyy";
		}

		get isYearlyFrequency() {
			return this.recurrence.freq === "YEARLY";
		}

		get isMonthlyFrequency() {
			return this.recurrence.freq === "MONTHLY";
		}

		get startDateMonth() {
			if (!this.recurrence.dtstart) return null;
			const [month] = this.recurrence.dtstart.split("/");
			return parseInt(month, 10);
		}

		disableDatePickerDates(date: Date) {
			if (this.isYearlyFrequency && this.recurrence.bymonth) {
				return date.getMonth() + 1 !== this.recurrence.bymonth;
			}
			if (this.isMonthlyFrequency) {
				const startDate = parse(this.recurrence.dtstart || "", "MM/dd/yyyy", new Date());
				return date < startDate || isNaN(startDate.getTime());
			}
			return false;
		}

		get formattedStartDate() {
			if (!this.recurrence.dtstart) return "";
			const date = parse(this.recurrence.dtstart || "", "MM/dd/yyyy", new Date());
			if (isNaN(date.getTime())) return "";
			const day = date.getDate();
			const dayWithSuffix = this.getOrdinalSuffix(day);
			const month = format(date, "MMMM");
			const year = format(date, "yyyy");
			return `${month} ${dayWithSuffix}, ${year}`;
		}

		getOrdinalSuffix(day: number) {
			if (day > 3 && day < 21) return day + "th";
			switch (day % 10) {
				case 1:
					return day + "st";
				case 2:
					return day + "nd";
				case 3:
					return day + "rd";
				default:
					return day + "th";
			}
		}

		private convertWeekdaysToShortForm(text: string): string {
			return TextConverter.convertWeekdaysToShortForm(text);
		}

		private convertMonthsToShortForm(text: string): string {
			return TextConverter.convertMonthsToShortForm(text);
		}

		public generateRule() {
			const dtstart = this.recurrence.dtstart ? parse(this.recurrence.dtstart, "MM/dd/yyyy", new Date()) : null;
			const formattedDate = dtstart && !isNaN(dtstart.getTime()) ? `${dtstart.getFullYear()}-${(dtstart.getMonth() + 1).toString().padStart(2, "0")}-${dtstart.getDate().toString().padStart(2, "0")}` : null;

			const untilDate = this.recurrence.until ? parse(this.recurrence.until, "MM/dd/yyyy", new Date()) : null;
			const formattedUntilDate = untilDate && !isNaN(untilDate.getTime()) ? `${untilDate.getFullYear()}-${(untilDate.getMonth() + 1).toString().padStart(2, "0")}-${untilDate.getDate().toString().padStart(2, "0")}` : null;

			let byweekday: Weekday[] | undefined = undefined;
			if (this.recurrence.byweekday && this.recurrence.byweekday.length > 0) {
				if (this.recurrence.byweekno && Number(this.recurrence.byweekno) !== 0) {
					if (this.recurrence.freq !== "WEEKLY") {
						byweekday = this.recurrence.byweekday.map((day) => {
							const weekday = RRule[day as keyof typeof RRule] as Weekday;
							return weekday.nth(Number(this.recurrence.byweekno));
						});
					} else {
						byweekday = this.recurrence.byweekday.map((day) => RRule[day as keyof typeof RRule] as Weekday);
					}
				} else {
					byweekday = this.recurrence.byweekday.map((day) => RRule[day as keyof typeof RRule] as Weekday);
				}
			}

			try {
				this.rule = new RRule({
					dtstart: dtstart && !isNaN(dtstart.getTime()) ? dtstart : null,
					freq: Frequency[this.recurrence.freq as keyof typeof Frequency],
					interval: this.recurrence.interval || 1,
					count: this.recurrence.count || undefined,
					until: untilDate && !isNaN(untilDate.getTime()) ? untilDate : null,
					bymonth: this.recurrence.bymonth ? [this.recurrence.bymonth] : undefined,
					byyearday: this.recurrence.byyearday
						? this.recurrence.byyearday
								.split(",")
								.map(Number)
								.filter((n) => !isNaN(n))
						: undefined,
					bymonthday: this.recurrence.bymonthday && this.recurrence.bymonthday.length > 0 ? this.recurrence.bymonthday.filter((day): day is number => day !== undefined) : undefined,
					byweekday: byweekday,
					byweekno: undefined,
					bysetpos: this.recurrence.bysetpos != null && this.recurrence.bysetpos !== 0 ? [this.recurrence.bysetpos] : undefined,
				});

				const requiredWeekdays = ["MO", "TU", "WE", "TH", "FR"];
				const selectedDays = this.recurrence.byweekday || [];
				const isWeekdaysOnly = selectedDays.length === 5 && requiredWeekdays.every((day) => selectedDays.includes(day));
				let ruleText = this.rule.toText() + ".";

				if (isWeekdaysOnly && this.recurrence.byweekno) {
					const weekNumber = this.recurrence.byweekno;
					let weekLabel = this.ordinalWords.find((w) => w.value.toString() === weekNumber)?.label || "";
					if (this.recurrence.freq === "MONTHLY") {
						let baseText = `every ${this.recurrence.interval > 1 ? this.recurrence.interval + " " : ""}${
							this.recurrence.interval === 1 ? "month," : "months,"
						} on the ${weekLabel}Mon, ${weekLabel}Tue, ${weekLabel}Wed, ${weekLabel}Thu and ${weekLabel}Fri`;
						if (this.recurrence.until) {
							const untilDate = parse(this.recurrence.until, "MM/dd/yyyy", new Date());
							if (!isNaN(untilDate.getTime())) {
								baseText += ` until ${format(untilDate, "MMM d, yyyy")}`;
							}
						} else if (this.recurrence.count && this.recurrence.count > 0) {
							baseText += ` after ${this.recurrence.count} occurrences`;
						}
						ruleText = baseText + ".";
					}
				}
				if (isWeekdaysOnly) {
					if (this.recurrence.freq === "WEEKLY") {
						ruleText = ruleText.replace(/every weekday/g, "every week on weekdays");
					}
				}

				ruleText = TextConverter.removeDuplicateAndPhrase(ruleText);
				if (this.recurrence.freq === "MONTHLY" && this.recurrence.bymonthday && this.recurrence.bymonthday.includes(-1)) {
					ruleText = ruleText.replace(/last/g, "last date");
				}

				ruleText = this.convertWeekdaysToShortForm(ruleText);
				ruleText = this.convertMonthsToShortForm(ruleText);
				if (this.recurrence.freq === "WEEKLY") {
					ruleText = ruleText.replace(/weeks days/g, "weeks on every day");
					if (this.recurrence.interval === 1) {
						ruleText = ruleText.replace(/every day/g, "every week on every day");
					}
				}

				this.ruleText = ruleText;
			} catch (e) {
				this.rule = null;
				this.ruleText = null;
			}
		}

		public submitRRule() {
			return (this.$refs.ruleObserver as any).validate().then((response: boolean) => {
				if (response) {
					if (this.repeatOption === "lastday" && this.recurrence.bymonthday && !this.recurrence.bymonthday.includes(-1)) {
						return false;
					}
					this.$emit("rrule", this.rule);
					return true;
				}
				return false;
			});
		}

		public selectFrequency(value: string) {
			if (value === this.recurrence.freq) {
				return;
			}
			this.recurrence.freq = value;
			this.updateFields();
			this.generateRule();
		}

		disableUntilDates(date: Date) {
			if (!this.recurrence.dtstart) {
				return false;
			}
			const startDate = parse(this.recurrence.dtstart, "MM/dd/yyyy", new Date());
			return date <= startDate || isNaN(startDate.getTime());
		}

		onUntilChanged(value: string) {
			if (value) {
				this.recurrence.count = 0;
			}
		}

		onCountChanged(value: number) {
			if (value) {
				this.recurrence.until = undefined;
			}
		}

		handleEndsOptionChange() {
			if (this.endsOption === "never") {
				this.recurrence.until = undefined;
				this.recurrence.count = 0;
			} else if (this.endsOption === "on") {
				this.recurrence.count = 0;
			} else if (this.endsOption === "after") {
				this.recurrence.until = undefined;
			}
		}

		get getMaxDaysInMonth() {
			if (!this.recurrence.bymonth) {
				return 31;
			}
			const selectedMonth = Number(this.recurrence.bymonth);
			return new Date(2024, selectedMonth, 0).getDate();
		}

		@Watch("recurrence", { deep: true })
		onRecurrenceChanged() {
			this.generateRule();
		}

		onRepeatOptionChange() {
			if (this.repeatOption === "days") {
				this.recurrence.bymonthday = [];
				this.recurrence.byweekno = "1";
			} else if (this.repeatOption === "lastday") {
				this.recurrence.byweekday = [];
				this.recurrence.byweekno = "1";
				this.recurrence.bysetpos = 0;
				this.recurrence.bymonthday = [-1];
			} else {
				this.recurrence.byweekday = [];
				this.recurrence.byweekno = "1";
				this.recurrence.bysetpos = 0;
				this.recurrence.bymonthday = [];
			}
		}

		created(): void {
			this.filteredFrequencies = this.frequencies;
			if (this.rrule) {
				const [dtstartLine, rruleLine] = this.rrule.split("\n");
				if (dtstartLine && rruleLine) {
					const dtstartRaw = dtstartLine.split(":")[1]?.trim();
					const dtstartFormatted = dtstartRaw ? `${dtstartRaw.substring(4, 6)}/${dtstartRaw.substring(6, 8)}/${dtstartRaw.substring(0, 4)}` : undefined;
					const recurrenceObj: Partial<IRecurrenceRule> = {
						dtstart: dtstartFormatted,
						byweekday: [], // Initialize to avoid undefined
						bymonthday: [],
					};
					const validKeys: Set<string> = new Set(["dtstart", "freq", "interval", "count", "until", "byyear", "bymonth", "byyearday", "bymonthday", "byweekday", "byweekno", "byhour", "byminute", "bysecond", "bysetpos", "byday"]);
					rruleLine
						.replace("RRULE:", "")
						.split(";")
						.forEach((part) => {
							const [key, value] = part.split("=");
							const lowerKey = key.toLowerCase();
							if (!validKeys.has(lowerKey)) return;
							if (["interval", "count", "bymonth", "byhour", "byminute", "bysecond", "bysetpos"].includes(lowerKey)) {
								(recurrenceObj as any)[lowerKey] = parseInt(value, 10);
							} else if (lowerKey === "until") {
								const untilFormatted = value ? `${value.substring(4, 6)}/${value.substring(6, 8)}/${value.substring(0, 4)}` : undefined;
								recurrenceObj.until = untilFormatted;
							} else if (["byyearday", "byweekno"].includes(lowerKey)) {
								(recurrenceObj as any)[lowerKey] = value;
							} else if (lowerKey === "bymonthday") {
								const days = value
									.split(",")
									.map(Number)
									.filter((n) => !isNaN(n));
								recurrenceObj.bymonthday = days;
							} else if (lowerKey === "byweekday" || lowerKey === "byday") {
								const weekdays = value.split(",");
								let foundWeekNo = false;
								const processedWeekdays = weekdays.map((day) => {
									const match = day.match(/^([-+]?\d+)?([A-Z]{2})$/);
									if (match) {
										const [, ordinal, weekday] = match;
										if (ordinal && !foundWeekNo) {
											recurrenceObj.byweekno = ordinal.replace("+", "");
											foundWeekNo = true;
										}
										return weekday.toUpperCase();
									}
									return day.toUpperCase();
								});
								recurrenceObj.byweekday = processedWeekdays;
							} else {
								(recurrenceObj as any)[lowerKey] = value;
							}
						});
					this.recurrence = new RecurrenceRuleModel(recurrenceObj as IRecurrenceRule);
					if (this.recurrence.count && this.recurrence.count > 0) {
						this.endsOption = "after";
					} else if (this.recurrence.until) {
						this.endsOption = "on";
					} else {
						this.endsOption = "never";
					}
					if ((this.recurrence.byweekday && this.recurrence.byweekday.length > 0) || this.recurrence.byweekno) {
						this.repeatOption = "days";
					} else if (this.recurrence.bymonthday && this.recurrence.bymonthday.includes(-1)) {
						this.repeatOption = "lastday";
					} else if (this.recurrence.bymonthday && this.recurrence.bymonthday.length > 0) {
						this.repeatOption = "date";
					}
					if (this.recurrence.byweekno && (this.recurrence.byweekday ?? []).length === 0) {
						this.recurrence.byweekday = ["MO", "TU", "WE", "TH", "FR"];
					}
					if (this.recurrence.byweekno === "") {
						this.recurrence.byweekno = "1";
					}
				}
			} else {
				this.recurrence.freq = "WEEKLY";
				this.recurrence.interval = 1;
				this.recurrence.byweekday = [];
				this.recurrence.bymonthday = [];
				this.recurrence.byweekno = "1";
			}
		}

		onMonthDaySelected(day: number) {
			if (!this.recurrence.bymonthday) {
				this.recurrence.bymonthday = [];
			}
			const index = this.recurrence.bymonthday.indexOf(day);
			if (index === -1) {
				this.recurrence.bymonthday.push(day);
			} else {
				this.recurrence.bymonthday.splice(index, 1);
			}
			this.onMonthDayChanged(this.recurrence.bymonthday);
		}

		onMonthDayChanged(value: number[]) {
			if (value && value.length > 0) {
				this.recurrence.bysetpos = 0;
				this.recurrence.byweekday = [];
			}
		}

		onSetPosChanged(value: string) {
			if (value) {
				this.recurrence.bymonthday = [];
			}
		}

		onDateSelected(value: string) {
			if (value) {
				const [month, day, year] = value.split("/");
				this.recurrence.bymonthday = [parseInt(day, 10)];
				this.onMonthDayChanged(this.recurrence.bymonthday);
			} else {
				this.recurrence.bymonthday = [];
			}
		}

		toggleWeekday(weekday: string) {
			if (!this.recurrence.byweekday) {
				this.recurrence.byweekday = [];
			}
			const index = this.recurrence.byweekday.indexOf(weekday);
			if (index === -1) {
				this.recurrence.byweekday.push(weekday);
			} else {
				this.recurrence.byweekday.splice(index, 1);
			}
		}

		handleIntervalInput(event: Event) {
			const input = event.target as HTMLInputElement;
			const value = parseInt(input.value);
			if (value < 1 || isNaN(value)) {
				this.recurrence.interval = 1;
			}
		}
	}
</script>

<template>
	<div class="recurring-event-container d-flex-column flex-1" v-if="showModal">
		<ValidationObserver ref="ruleObserver" tag="div" class="d-flex-column flex-1">
			<div class="qn-d-flex-wrap mb-3">
				<label class="recurrence-column-left form-label mb-0 pt-1 me-2">Starts from: <mark>*</mark></label>
				<ValidationProvider name="Date" rules="required" v-slot="v" tag="div" class="recurrence-column-right">
					<date-picker type="date" v-model="dtstartModel" :placeholder="getDateFormat" :format="getDateFormat" :value-type="'format'" :class="{ 'error-border': v.errors.length > 0 }"></date-picker>
				</ValidationProvider>
			</div>

			<div class="qn-d-flex-wrap mb-3">
				<label class="recurrence-column-left form-label mb-0 me-2 pt-2">Repeats:</label>
				<ValidationProvider name="Frequency" :rules="recurrence.freq == '' ? 'required' : ''" v-slot="v" tag="div">
					<div class="d-flex gap-3">
						<b-button-group toggle>
							<b-button v-for="freq in frequencies" :key="freq.value" :value="freq.value" :pressed="recurrence.freq === freq.value" @click="selectFrequency(freq.value)" variant="outline-info"> {{ freq.label }}ly </b-button>
						</b-button-group>
					</div>
					<div class="invalid-feedback" :class="v.classes">
						<span class="validation-span" :class="v.classes">{{ v.errors[0] }}</span>
					</div>
				</ValidationProvider>
			</div>

			<div class="qn-d-flex-wrap mb-3">
				<label class="recurrence-column-left form-label mb-0 me-2 pt-1">Interval:</label>
				<ValidationProvider name="Interval" :rules="['WEEKLY'].includes(recurrence.freq) ? 'required|numeric|min_value:1' : ''" v-slot="v" tag="div">
					<div class="qn-d-flex">
						<input type="number" class="form-control me-2" v-model.number="recurrence.interval" min="1" @input="handleIntervalInput" :class="{ 'error-border': v.errors.length > 0 }" />
						<label class="form-label mb-0 pt-1 me-2" v-if="recurrence.freq != ''"> {{ getFrequencyLabel }}(s) </label>
					</div>
				</ValidationProvider>
			</div>

			<div class="qn-d-flex mb-3" v-if="recurrence.freq === 'WEEKLY'">
				<label class="recurrence-column-left form-label mb-0 pt-1 me-2">Select day(s): <mark>*</mark></label>
				<ValidationProvider name="Weekdays" :rules="recurrence.freq === 'WEEKLY' && recurrence.byweekday.length == 0 ? 'required|min_value:1' : ''" v-slot="v" tag="div">
					<div class="weekday-select">
						<div v-for="(wk, index) in wkst" :key="index" :class="['weekday', { selected: recurrence.byweekday && recurrence.byweekday.includes(wk.value) }]" @click="toggleWeekday(wk.value)">
							{{ wk.label }}
						</div>
					</div>
					<div class="invalid-feedback" :class="v.classes">
						<span class="validation-span" :class="v.classes">{{ v.errors[0] === "Weekdays must be greater than 0." ? "Please select at least one day" : v.errors[0] }}</span>
					</div>
				</ValidationProvider>
			</div>

			<div class="" :class="{ 'border-bottom border-top py-3 mb-2 day-date-picker': ['MONTHLY', 'YEARLY'].includes(recurrence.freq) }">
				<div class="qn-d-flex-wrap pb-3" v-if="['YEARLY'].includes(recurrence.freq)" style="min-height: 46px">
					<label class="recurrence-column-left form-label mb-0 pt-1 me-2">Month: <mark>*</mark></label>
					<ValidationProvider name="Month" :rules="recurrence.freq === 'YEARLY' ? 'required|min_value:1' : ''" v-slot="v" tag="div">
						<select v-model="recurrence.bymonth" class="form-select" :class="{ 'error-border': v.errors.length > 0 }">
							<option value="0">Select</option>
							<option v-for="month in months" :key="month.value" :value="month.value">{{ month.label }}</option>
						</select>
					</ValidationProvider>
				</div>
				<div class="recurrence-select-days qn-d-flex" v-if="['MONTHLY', 'YEARLY'].includes(recurrence.freq)">
					<div class="form-check recurrence-column-left align-items-start me-2 pt-1">
						<input type="radio" class="form-check-input" id="repeatDays" value="days" v-model="repeatOption" @change="onRepeatOptionChange" />
						<label class="form-label mb-0 ps-2" for="repeatDays"> Select day(s):</label>
					</div>
					<div class="qn-d-flex-wrap gap-2">
						<ValidationProvider name="Week Number" :rules="repeatOption === 'days' ? 'required|min_value:1' : ''" v-slot="v" tag="div">
							<select class="form-select day-select" v-model="recurrence.byweekno" :disabled="repeatOption !== 'days'" @change="repeatOption === 'days' && onSetPosChanged" :class="{ 'error-border': v.errors.length > 0 }">
								<option v-for="ordinal in ordinalWords" :key="ordinal.value" :value="ordinal.value.toString()" :selected="ordinal.value === 1">
									{{ ordinal.label }}
								</option>
							</select>
						</ValidationProvider>
						<ValidationProvider name="Weekdays" :rules="repeatOption === 'days' && recurrence.byweekday.length == 0 ? 'required|min_value:1' : ''" v-slot="v" tag="div">
							<div class="weekday-select">
								<div
									v-for="(wk, index) in wkst"
									:key="index"
									:class="['weekday', { selected: recurrence.byweekday && recurrence.byweekday.includes(wk.value), 'disabled-container': repeatOption !== 'days' }]"
									@click="repeatOption === 'days' && toggleWeekday(wk.value)"
								>
									{{ wk.label }}
								</div>
							</div>
							<div class="invalid-feedback" :class="v.classes">
								<span class="validation-span" :class="v.classes">{{ v.errors[0] === "Weekdays must be greater than 0." ? "Please select at least one day" : v.errors[0] }}</span>
							</div>
						</ValidationProvider>
					</div>
				</div>
				<div class="qn-d-flex" :class="{ 'recurrence-pick-date': recurrence.freq === 'YEARLY' }" v-if="['MONTHLY', 'YEARLY'].includes(recurrence.freq)">
					<div class="recurrence-column-left form-check me-2 align-items-start">
						<input type="radio" class="form-check-input pick-date-radio-btn" id="repeatDate" value="date" v-model="repeatOption" @change="onRepeatOptionChange" />
						<label class="form-label mb-0 ps-2" for="repeatDate">Pick date(s):</label>
					</div>
					<div class="">
						<ValidationProvider name="Month Date" :rules="['MONTHLY', 'YEARLY'].includes(recurrence.freq) && recurrence.bymonthday.length == 0 && repeatOption == 'date' ? 'required|min_value:1' : ''" v-slot="v" tag="div" class="">
							<div class="monthday-select">
								<div
									v-for="day in getMaxDaysInMonth"
									:key="day"
									:class="['monthday', { selected: recurrence.bymonthday && recurrence.bymonthday.includes(day), 'disabled-container': repeatOption !== 'date' }]"
									@click="repeatOption === 'date' && onMonthDaySelected(day)"
								>
									{{ day }}
								</div>
							</div>
							<div class="invalid-feedback" :class="v.classes">
								<span class="validation-span" :class="v.classes">{{ v.errors[0] === "Month Date must be greater than 0." ? "Please select at least one day" : v.errors[0] }}</span>
							</div>
						</ValidationProvider>
					</div>
				</div>
				<div class="pt-3" v-if="['MONTHLY'].includes(recurrence.freq)">
					<div class="form-check me-2 align-items-start">
						<input type="radio" class="form-check-input" id="repeatLastDay" value="lastday" v-model="repeatOption" @change="onRepeatOptionChange" />
						<label class="form-label mb-0 ps-2" for="repeatLastDay">Last day of the month.</label>
					</div>
				</div>
			</div>

			<div class="qn-d-flex mb-3">
				<label class="recurrence-column-left form-label mb-0 me-2 pt-2">Ends:</label>
				<div>
					<div class="end-never d-flex align-items-center">
						<div class="form-check">
							<input type="radio" class="form-check-input" id="endsNever" value="never" v-model="endsOption" @change="handleEndsOptionChange" />
							<label class="form-check-label" for="endsNever">Never</label>
						</div>
					</div>
					<div class="ends-on d-v-center">
						<div class="form-check">
							<input type="radio" class="form-check-input" id="endsOn" value="on" v-model="endsOption" @change="handleEndsOptionChange" />
							<label class="form-check-label me-2" for="endsOn">On</label>
						</div>
						<div class="" v-if="endsOption === 'on'">
							<ValidationProvider name="End Date" :rules="endsOption === 'on' ? 'required' : ''" class="d-v-center" v-slot="v" tag="div">
								<date-picker type="date" v-model="untilModel" :placeholder="getDateFormat" :format="getDateFormat" :value-type="'format'" :disabled-date="disableUntilDates" :class="{ 'error-border': v.errors.length > 0 }"></date-picker>
							</ValidationProvider>
						</div>
					</div>
					<div class="ends-after d-v-center">
						<div class="form-check">
							<input type="radio" class="form-check-input" id="endsAfter" value="after" v-model="endsOption" @change="handleEndsOptionChange" />
							<label class="form-check-label me-2 mb-0" for="endsAfter">After</label>
						</div>
						<div class="" v-if="endsOption === 'after'">
							<ValidationProvider name="Occurrences" :rules="endsOption === 'after' ? 'required|numeric|min_value:1' : ''" class="d-v-center" v-slot="v" tag="div">
								<input type="number" class="form-control me-2" v-model.number="recurrence.count" min="0" :class="{ 'error-border': v.errors.length > 0 }" />
								<label class="form-label mb-0 me-3">Occurrence(s)</label>
							</ValidationProvider>
						</div>
					</div>
				</div>
			</div>

			<div v-if="rule || ruleText" class="rule-output mt-auto">
				<span class="fw-600 me-1">Repeats:</span>
				<span v-if="formattedStartDate">from {{ formattedStartDate }}, </span>
				<span>{{ ruleText }}</span>
			</div>
		</ValidationObserver>
	</div>
</template>

<style lang="scss" scoped>
	.recurring-event-container {
		.mx-datepicker {
			width: 130px;
			height: 30px;
		}
		.form-select {
			width: 115px;
			height: 30px;
		}
		.form-select {
			padding: 6px 10px;
			line-height: 1;
		}
		.form-select.day-select {
			width: 70px;
		}
		input[type="number"] {
			width: 50px;
			height: 30px;
			padding-inline: 5px;
		}
		.form-label {
			font-size: 13px;
			font-family: Poppins, sans-serif;
		}
		.ends-on,
		.ends-after,
		.end-never,
		.repeat-days,
		.repeat-date {
			height: 36px;
			align-items: flex-start;
		}
		.ends-on,
		.ends-after {
			.form-check {
				padding-top: 5px;
			}
		}
	}
	.weekday-select,
	.monthday-select {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.weekday,
	.monthday {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		width: 24px;
		height: 24px;
		cursor: pointer;
		border-radius: 50%;
		border: 1px solid #dee2e3;
		user-select: none;
		transition: background-color 0.3s, color 0.3s;
		box-shadow: 0px 1px 0px rgba(0, 0, 0, 0.1);
	}
	.weekday.selected,
	.monthday.selected {
		background-color: #00b3fb;
		color: white;
		border-color: #00b3fb;
	}
	.weekday.disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background-color: #f5f5f5;
		border-color: #ddd;
	}
	.recurrence-column-left {
		flex: 0 0 125px;
	}
	.day-date-picker {
		input.form-check-input {
			margin-top: 3px;
		}
		.recurrence-column-left label {
			color: #79868c;
		}
	}
	.disabled-container {
		opacity: 0.6;
		pointer-events: none;
		user-select: none;
	}
	.recurrence-select-days {
		min-height: 50px;
	}
	.recurrence-pick-date {
		min-height: 142px;
	}
</style>
