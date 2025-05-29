import EcRecurringRule from "./components/EcRecurringRule.vue";
import Vue from "vue";

export default {
	install(vue: typeof Vue) {
		vue.component("EcRecurringRule", EcRecurringRule);
	},
};

export { EcRecurringRule };
