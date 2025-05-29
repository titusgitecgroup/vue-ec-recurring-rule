import { mount } from "@vue/test-utils";
import EcRecurringRule from "../src/components/EcRecurringRule.vue";

describe("EcRecurringRule", () => {
  it("renders correctly", () => {
    const wrapper = mount(EcRecurringRule, {
      propsData: {
        frequencies: [
          { value: "DAILY", label: "Dai" },
          { value: "WEEKLY", label: "Week" },
          { value: "MONTHLY", label: "Month" },
          { value: "YEARLY", label: "Year" },
        ],
      },
    });
    expect(wrapper.exists()).toBe(true);
  });
});