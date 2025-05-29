# vue-ec-recurring-rule

A Vue component for creating recurring rules using rrule.js.

## Installation

```bash
npm install vue-ec-recurring-rule
```

## Usage

```javascript
import Vue from "vue";
import EcRecurringRule from "vue-ec-recurring-rule";

Vue.use(EcRecurringRule);

// In your component
<template>
  <ec-recurring-rule :frequencies="frequencies" @rrule="handleRRule" />
</template>

<script>
export default {
  data() {
    return {
      frequencies: [
        { value: "DAILY", label: "Dai" },
        { value: "WEEKLY", label: "Week" },
        { value: "MONTHLY", label: "Month" },
        { value: "YEARLY", label: "Year" },
      ],
    };
  },
  methods: {
    handleRRule(rule) {
      console.log("Generated Rule:", rule);
    },
  },
};
</script>
```

## Props

- `frequencies` (Array, required): List of frequency options with `value` and `label`.
- `rrule` (String, optional): Initial rrule string to populate the component.

## Dependencies

- `vue`: ^2.6.0 || ^3.0.0
- `rrule`: ^2.6.0
- `date-fns`: ^2.0.0
- `vee-validate`: ^3.0.0 || ^4.0.0
- `vue2-datepicker`: ^3.0.0

## License

MIT
